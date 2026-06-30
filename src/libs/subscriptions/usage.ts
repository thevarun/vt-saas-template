import * as Sentry from '@sentry/nextjs';
import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { resourceUsage, userSubscriptions } from '@/models/Schema';

import { getCurrentPeriod, toDateString } from './period';
import { invalidateQuotaCache } from './quota';

// pg error codes treated as transient (worth one retry).
//   40P01 = deadlock_detected
//   40001 = serialization_failure
const TRANSIENT_PG_CODES = new Set(['40P01', '40001']);

async function withTransientRetry<T>(op: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      const code = (err as { code?: string } | null)?.code;
      if (!code || !TRANSIENT_PG_CODES.has(code)) {
        // Non-transient: stop immediately.
        throw err;
      }
      // Transient: loop will retry up to `attempts` total times.
    }
  }
  throw lastErr;
}

export type UsageRecord = {
  premiumUnitsUsed: number;
  fallbackUnitsUsed: number;
  periodStart: string;
  periodEnd: string;
};

/**
 * Fetches the rolling-period anchor for a user. Falls back to NOW() if the row
 * is missing (should be impossible — the signup trigger creates one).
 */
async function getPeriodAnchor(userId: string): Promise<Date> {
  const rows = await db
    .select({
      currentPeriodAnchorAt: userSubscriptions.currentPeriodAnchorAt,
      startedAt: userSubscriptions.startedAt,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  return rows[0]?.currentPeriodAnchorAt ?? rows[0]?.startedAt ?? new Date();
}

/**
 * Gets usage for a user+resource in the current rolling period.
 * Returns a zeroed record if no row exists yet (first use this period).
 */
export async function getUsage(userId: string, resourceType: string): Promise<UsageRecord> {
  const anchor = await getPeriodAnchor(userId);
  const period = getCurrentPeriod(anchor);
  const periodStartStr = toDateString(period.start);

  const rows = await db
    .select({
      premiumUnitsUsed: resourceUsage.premiumUnitsUsed,
      fallbackUnitsUsed: resourceUsage.fallbackUnitsUsed,
      periodStart: resourceUsage.periodStart,
      periodEnd: resourceUsage.periodEnd,
    })
    .from(resourceUsage)
    .where(
      and(
        eq(resourceUsage.userId, userId),
        eq(resourceUsage.resourceType, resourceType),
        eq(resourceUsage.periodStart, periodStartStr),
      ),
    )
    .limit(1);

  if (rows.length === 0 || !rows[0]) {
    return {
      premiumUnitsUsed: 0,
      fallbackUnitsUsed: 0,
      periodStart: periodStartStr,
      periodEnd: toDateString(period.end),
    };
  }

  return rows[0];
}

/**
 * Batched variant of {@link getUsage}: fetches usage for several resource types
 * in a SINGLE query, and takes the period anchor as an argument instead of
 * re-fetching it from `user_subscriptions`.
 *
 * Used by `getSubscriptionUsage`, which already holds the anchor and would
 * otherwise issue one `getUsage` call per resource — each doing its own anchor
 * lookup + its own usage select. This collapses those to 1. Resource types with
 * no row this period are returned zeroed.
 */
export async function getUsageBatch(
  userId: string,
  resourceTypes: string[],
  anchor: Date,
): Promise<Map<string, UsageRecord>> {
  const period = getCurrentPeriod(anchor);
  const periodStartStr = toDateString(period.start);
  const periodEndStr = toDateString(period.end);

  const rows = await db
    .select({
      resourceType: resourceUsage.resourceType,
      premiumUnitsUsed: resourceUsage.premiumUnitsUsed,
      fallbackUnitsUsed: resourceUsage.fallbackUnitsUsed,
      periodStart: resourceUsage.periodStart,
      periodEnd: resourceUsage.periodEnd,
    })
    .from(resourceUsage)
    .where(
      and(
        eq(resourceUsage.userId, userId),
        inArray(resourceUsage.resourceType, resourceTypes),
        eq(resourceUsage.periodStart, periodStartStr),
      ),
    );

  const result = new Map<string, UsageRecord>();
  for (const resourceType of resourceTypes) {
    const row = rows.find(r => r.resourceType === resourceType);
    result.set(resourceType, row
      ? {
          premiumUnitsUsed: row.premiumUnitsUsed,
          fallbackUnitsUsed: row.fallbackUnitsUsed,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
        }
      : {
          premiumUnitsUsed: 0,
          fallbackUnitsUsed: 0,
          periodStart: periodStartStr,
          periodEnd: periodEndStr,
        });
  }
  return result;
}

/**
 * Records units consumed after a quota-gated operation completes.
 *
 * Determines whether the consumed pool is premium or fallback by comparing
 * `unitKey` against `premiumUnitKey` (passed from the checkQuota result).
 * Uses an atomic upsert to avoid race conditions.
 *
 * @param userId - The authenticated user's ID
 * @param resourceType - e.g. 'generation', 'api_call'
 * @param unitKey - The pool that was actually used (from quotaResult.unitKey)
 * @param units - The number of units consumed
 * @param premiumUnitKey - The tier's premium pool key (null if the tier has none)
 */
export async function recordUsage(
  userId: string,
  resourceType: string,
  unitKey: string,
  units: number,
  premiumUnitKey: string | null,
): Promise<void> {
  if (units <= 0) {
    return;
  }

  const anchor = await getPeriodAnchor(userId);
  const period = getCurrentPeriod(anchor);
  const periodStartStr = toDateString(period.start);
  const periodEndStr = toDateString(period.end);

  const isPremium = premiumUnitKey !== null && unitKey === premiumUnitKey;

  try {
    await withTransientRetry(() =>
      db
        .insert(resourceUsage)
        .values({
          userId,
          resourceType,
          periodStart: periodStartStr,
          periodEnd: periodEndStr,
          premiumUnitsUsed: isPremium ? units : 0,
          fallbackUnitsUsed: isPremium ? 0 : units,
        })
        .onConflictDoUpdate({
          target: [resourceUsage.userId, resourceUsage.resourceType, resourceUsage.periodStart],
          set: {
            premiumUnitsUsed: isPremium
              ? sql`${resourceUsage.premiumUnitsUsed} + ${units}`
              : resourceUsage.premiumUnitsUsed,
            fallbackUnitsUsed: isPremium
              ? resourceUsage.fallbackUnitsUsed
              : sql`${resourceUsage.fallbackUnitsUsed} + ${units}`,
            updatedAt: sql`NOW()`,
          },
        }),
    );

    // The quota cache is keyed by (user, resourceType) and holds usage counts for
    // up to CACHE_TTL_MS (60s). Without this, a checkQuota immediately after a
    // recordUsage would read the stale pre-write counts for the rest of that
    // window — a stale-window over-spend. Invalidate only on a successful write
    // (on failure the cached counts are still accurate — nothing was recorded).
    invalidateQuotaCache(userId, resourceType);
  } catch (error) {
    // Usage recording is best-effort — log but don't throw (don't fail the
    // user's request). We still warn Sentry so we can spot if transient pg
    // errors become persistent.
    const errorCode = (error as { code?: string } | null)?.code;
    logger.error(
      { error, userId, resourceType, unitKey, units, errorCode },
      'recordUsage: failed to record usage after retry',
    );
    Sentry.captureMessage('recordUsage failed after retry', {
      level: 'warning',
      user: { id: userId },
      extra: { userId, resourceType, unitKey, units, errorCode },
    });
  }
}
