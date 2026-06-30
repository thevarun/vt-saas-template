import type { User } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';

import { trackEventServer } from '@/libs/analytics/server';
import { db } from '@/libs/DB';
import { blockScheduledTasksForUser } from '@/libs/jobs/blocking';
import { logger } from '@/libs/Logger';
import { subscriptionTiers, tierQuotas, userSubscriptions } from '@/models/Schema';

import { getCurrentPeriod } from './period';
import { getUsage } from './usage';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

// UsageWarning + Downgrade describe the telemetry a caller can surface (a
// usage-approaching banner, a pool-downgrade notice). snake_case fields are kept
// so they serialize cleanly if a product forwards them over a wire boundary.
export type UsageWarning = {
  type: 'approaching_premium_limit';
  usage_pct: number;
  resets_at: Date;
};

export type Downgrade = {
  reason: 'premium_exhausted';
  current_unit_key: string;
  resets_at: Date;
};

/**
 * Result of resolving which pool a user should draw from for a resource type,
 * plus the gate decision (when `enforce: true`).
 *
 * The two-pool model is generic: a product maps `unitKey` to whatever it meters
 * (an AI model id, a rate-limit bucket, …). See `tier_quotas` for the model.
 */
export type QuotaDecision = {
  /** True when the user can make this call. Always true under enforce:false. */
  allowed: boolean;
  /** The pool the user should draw from (premium while budget remains, else fallback). */
  unitKey: string;
  /** The tier's premium pool key — needed by recordUsage for usage tagging. */
  premiumUnitKey: string | null;
  usagePct: { premium: number; fallback: number };
  warning?: UsageWarning;
  downgrade?: Downgrade;
  resetsAt: Date;
};

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

type CacheEntry = {
  state: QuotaState;
  expiresAt: number;
};

const CACHE_TTL_MS = 60_000; // 60 seconds — accepts staleness, avoids per-call DB hit on hot paths.
const stateCache = new Map<string, CacheEntry>();

function getCacheKey(userId: string, resourceType: string): string {
  return `${userId}:${resourceType}`;
}

function getCachedState(key: string): QuotaState | null {
  const entry = stateCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    stateCache.delete(key);
    return null;
  }
  return entry.state;
}

function setCachedState(key: string, state: QuotaState): void {
  stateCache.set(key, { state, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Invalidates the cached quota state for a user+resource after usage is recorded. */
export function invalidateQuotaCache(userId: string, resourceType: string): void {
  stateCache.delete(getCacheKey(userId, resourceType));
}

/** Clears the entire cache. Test-only — do NOT call in production code. @internal */
export function clearQuotaCache(): void {
  stateCache.clear();
}

// ---------------------------------------------------------------------------
// Private: loadUserQuotaState — single source of joined tier+usage data
// ---------------------------------------------------------------------------

type QuotaState = {
  tierName: string;
  premiumUnitKey: string | null;
  premiumLimit: number;
  fallbackUnitKey: string;
  fallbackLimit: number;
  warningThresholdPct: number;
  premiumUsed: number;
  fallbackUsed: number;
  resetsAt: Date;
};

/**
 * Loads the joined subscription + tier + tier_quotas row + current-period usage
 * for a user. Handles lazy trial / promotion expiry along the way.
 *
 * Falls back to the 'free' tier row when the user has no subscription — should
 * not happen (the signup trigger ensures every user has a row), but we degrade
 * gracefully rather than throw.
 *
 * Throws only when the 'free' tier itself is missing from the DB (a broken env)
 * — callers convert this into a 5xx.
 */
async function loadUserQuotaState(
  userId: string,
  resourceType: string,
): Promise<QuotaState> {
  const cacheKey = getCacheKey(userId, resourceType);
  const cached = getCachedState(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await db
    .select({
      status: userSubscriptions.status,
      trialExpiresAt: userSubscriptions.trialExpiresAt,
      expiresAt: userSubscriptions.expiresAt,
      currentPeriodAnchorAt: userSubscriptions.currentPeriodAnchorAt,
      startedAt: userSubscriptions.startedAt,
      tierName: subscriptionTiers.name,
      premiumUnitKey: tierQuotas.premiumUnitKey,
      premiumPeriodLimit: tierQuotas.premiumPeriodLimit,
      fallbackUnitKey: tierQuotas.fallbackUnitKey,
      fallbackPeriodLimit: tierQuotas.fallbackPeriodLimit,
      warningThresholdPct: tierQuotas.warningThresholdPct,
    })
    .from(userSubscriptions)
    .innerJoin(subscriptionTiers, eq(userSubscriptions.tierId, subscriptionTiers.id))
    .innerJoin(
      tierQuotas,
      and(
        eq(tierQuotas.tierId, subscriptionTiers.id),
        eq(tierQuotas.resourceType, resourceType),
      ),
    )
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (rows.length === 0 || !rows[0]) {
    // No subscription row — degrade to the 'free' tier so the call still
    // resolves a sensible pool rather than failing.
    logger.warn({ userId }, 'loadUserQuotaState: no subscription found — using free tier');
    return loadFreeTierState(resourceType);
  }

  const row = rows[0];

  // Lazy trial expiry: trial flipped past its expiry between the cron tick and now.
  // Recurse ONLY if the demotion actually mutated the row. If the 'free' tier is
  // missing (broken env — no seed.sql), the helper can't demote and returns
  // false; recursing would re-enter this exact branch forever, hammering the DB.
  // Degrade to the same recoverable error loadFreeTierState throws instead.
  if (row.status === 'trial' && row.trialExpiresAt && row.trialExpiresAt < new Date()) {
    const demoted = await expireTrialToFree(userId);
    if (!demoted) {
      throw new Error(`loadUserQuotaState: cannot expire trial — free tier is missing from DB`);
    }
    stateCache.delete(cacheKey);
    return loadUserQuotaState(userId, resourceType);
  }

  // Lazy promotion expiry: same idea (and same guard) for admin-granted promotions.
  if (row.tierName === 'promotion' && row.expiresAt && row.expiresAt < new Date()) {
    const demoted = await expirePromotionToFree(userId);
    if (!demoted) {
      throw new Error(`loadUserQuotaState: cannot expire promotion — free tier is missing from DB`);
    }
    stateCache.delete(cacheKey);
    return loadUserQuotaState(userId, resourceType);
  }

  const usage = await getUsage(userId, resourceType);
  const period = getCurrentPeriod(row.currentPeriodAnchorAt ?? row.startedAt);

  const state: QuotaState = {
    tierName: row.tierName,
    premiumUnitKey: row.premiumUnitKey,
    premiumLimit: row.premiumPeriodLimit,
    fallbackUnitKey: row.fallbackUnitKey,
    fallbackLimit: row.fallbackPeriodLimit,
    warningThresholdPct: row.warningThresholdPct,
    premiumUsed: usage.premiumUnitsUsed,
    fallbackUsed: usage.fallbackUnitsUsed,
    resetsAt: period.end,
  };

  setCachedState(cacheKey, state);
  return state;
}

/**
 * Loads a synthetic QuotaState seeded from the 'free' tier's row, with zero
 * usage. Used as the missing-subscription safety net so a call still resolves a
 * sensible pool rather than failing.
 *
 * Throws if the 'free' tier or its tier_quotas row for the resource type is
 * missing — that's a broken environment, not a runtime condition we can recover
 * from. (Run supabase/seed.sql to seed the default tiers + quota rows.)
 */
async function loadFreeTierState(resourceType: string): Promise<QuotaState> {
  const rows = await db
    .select({
      tierName: subscriptionTiers.name,
      premiumUnitKey: tierQuotas.premiumUnitKey,
      premiumPeriodLimit: tierQuotas.premiumPeriodLimit,
      fallbackUnitKey: tierQuotas.fallbackUnitKey,
      fallbackPeriodLimit: tierQuotas.fallbackPeriodLimit,
      warningThresholdPct: tierQuotas.warningThresholdPct,
    })
    .from(subscriptionTiers)
    .innerJoin(
      tierQuotas,
      and(
        eq(tierQuotas.tierId, subscriptionTiers.id),
        eq(tierQuotas.resourceType, resourceType),
      ),
    )
    .where(eq(subscriptionTiers.name, 'free'))
    .limit(1);

  if (rows.length === 0 || !rows[0]) {
    throw new Error(`loadFreeTierState: free tier or its ${resourceType} quota row is missing from DB`);
  }

  const row = rows[0];
  // Synthetic: pretend the user is fresh into their period.
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return {
    tierName: row.tierName,
    premiumUnitKey: row.premiumUnitKey,
    premiumLimit: row.premiumPeriodLimit,
    fallbackUnitKey: row.fallbackUnitKey,
    fallbackLimit: row.fallbackPeriodLimit,
    warningThresholdPct: row.warningThresholdPct,
    premiumUsed: 0,
    fallbackUsed: 0,
    resetsAt: farFuture,
  };
}

/**
 * Demotes an expired trial to the 'free' tier.
 *
 * Returns `true` once the row has been mutated. Returns `false` when the 'free'
 * tier is missing from the DB (broken env) — the caller must NOT recurse in that
 * case, since the row is unchanged and would re-trigger the same expiry branch.
 */
async function expireTrialToFree(userId: string): Promise<boolean> {
  const freeTierId = await getTierIdByName('free');
  if (!freeTierId) {
    logger.error({ userId }, 'expireTrialToFree: free tier not found in DB');
    return false;
  }

  await db
    .update(userSubscriptions)
    .set({
      status: 'expired',
      tierId: freeTierId,
      currentPeriodAnchorAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  await blockScheduledTasksForUser(userId, 'trial_expired');

  trackEventServer(
    'trial_expired',
    { trigger_source: 'lazy_quota_check' },
    userId,
  ).catch(err => logger.warn({ error: err, userId }, '[quota] trial_expired tracking failed'));

  return true;
}

/**
 * Demotes an expired promotion to the 'free' tier. Same contract as
 * {@link expireTrialToFree}: returns `false` (without mutating the row) when the
 * 'free' tier is missing, so the caller can avoid an infinite recursion.
 */
async function expirePromotionToFree(userId: string): Promise<boolean> {
  const freeTierId = await getTierIdByName('free');
  if (!freeTierId) {
    logger.error({ userId }, 'expirePromotionToFree: free tier not found in DB');
    return false;
  }

  logger.info({ userId }, 'quota: promotion period expired — downgrading to free');
  await db
    .update(userSubscriptions)
    .set({
      status: 'expired',
      tierId: freeTierId,
      currentPeriodAnchorAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  await blockScheduledTasksForUser(userId, 'promotion_expired');

  return true;
}

async function getTierIdByName(name: string): Promise<string | null> {
  const rows = await db
    .select({ id: subscriptionTiers.id })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.name, name))
    .limit(1);
  return rows[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// decideQuota — pure: state + mode → QuotaDecision
// ---------------------------------------------------------------------------

function decideQuota(state: QuotaState, enforce: boolean): QuotaDecision {
  const premiumPct = state.premiumLimit > 0 ? (state.premiumUsed / state.premiumLimit) * 100 : 0;
  const fallbackPct = state.fallbackLimit > 0 ? (state.fallbackUsed / state.fallbackLimit) * 100 : 0;
  const usagePct = {
    premium: Math.round(premiumPct * 100) / 100,
    fallback: Math.round(fallbackPct * 100) / 100,
  };

  // A pool is "usable" iff it has a positive period limit AND budget remains.
  // A zero limit means the tier explicitly disables that pool — never treat that
  // as "infinite budget available".
  const premiumUsable
    = state.premiumLimit > 0
      && state.premiumUsed < state.premiumLimit
      && state.premiumUnitKey !== null;
  const fallbackUsable
    = state.fallbackLimit > 0
      && state.fallbackUsed < state.fallbackLimit;

  // enforce:false short-circuits the gate but keeps premium-aware pool selection
  // so background callers automatically downgrade to fallback when premium is
  // exhausted.
  const allowed = enforce ? (premiumUsable || fallbackUsable) : true;
  const premiumExhausted = state.premiumLimit > 0 && state.premiumUsed >= state.premiumLimit;

  if (!allowed) {
    return {
      allowed: false,
      unitKey: state.fallbackUnitKey,
      premiumUnitKey: state.premiumUnitKey,
      usagePct,
      resetsAt: state.resetsAt,
    };
  }

  // Premium available — re-check premiumUnitKey !== null for TS narrowing.
  if (premiumUsable && state.premiumUnitKey !== null) {
    const warning: UsageWarning | undefined = premiumPct >= state.warningThresholdPct
      ? { type: 'approaching_premium_limit', usage_pct: usagePct.premium, resets_at: state.resetsAt }
      : undefined;
    return {
      allowed,
      unitKey: state.premiumUnitKey,
      premiumUnitKey: state.premiumUnitKey,
      usagePct,
      warning,
      resetsAt: state.resetsAt,
    };
  }

  // Premium exhausted (or tier has no premium pool) → fallback.
  const downgrade: Downgrade | undefined
    = (state.premiumLimit > 0 && premiumExhausted)
      ? { reason: 'premium_exhausted', current_unit_key: state.fallbackUnitKey, resets_at: state.resetsAt }
      : undefined;

  return {
    allowed,
    unitKey: state.fallbackUnitKey,
    premiumUnitKey: state.premiumUnitKey,
    usagePct,
    downgrade,
    resetsAt: state.resetsAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves which pool a user should draw from for a given resource type, and
 * gates the call when `enforce: true`.
 *
 * - `enforce: true` (default) — full quota gate. `allowed` reflects actual
 *   usage; emits a `quota_limit_reached` event when both pools are exhausted.
 * - `enforce: false` — selection only. `allowed` is always `true`, no event is
 *   emitted, but `unitKey` is still premium-aware (premium while budget remains,
 *   fallback once exhausted, with `downgrade` populated). Use for best-effort
 *   background calls.
 *
 * Missing subscription (should not happen — the signup trigger creates one) →
 * falls back to the 'free' tier row. Reads `tier_quotas + resource_usage`,
 * cached for 60s. Handles lazy trial / promotion expiry.
 */
export async function checkQuota(
  user: User,
  resourceType: string,
  options?: { enforce?: boolean },
): Promise<QuotaDecision> {
  return checkQuotaByUserId(user.id, resourceType, options);
}

/**
 * `checkQuota` variant for background callers (Inngest jobs, pipelines) that
 * only have a `userId` string and not the full Supabase `User`.
 */
export async function checkQuotaByUserId(
  userId: string,
  resourceType: string,
  options?: { enforce?: boolean },
): Promise<QuotaDecision> {
  const enforce = options?.enforce ?? true;
  const state = await loadUserQuotaState(userId, resourceType);
  const result = decideQuota(state, enforce);

  // Only emit quota_limit_reached in enforce mode and only when the gate fires.
  if (enforce && !result.allowed) {
    trackEventServer(
      'quota_limit_reached',
      { resource_type: resourceType, tier_name: state.tierName },
      userId,
    ).catch(err => logger.warn({ error: err, userId }, '[quota] quota_limit_reached tracking failed'));
  }

  return result;
}
