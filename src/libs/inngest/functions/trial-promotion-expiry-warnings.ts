import { and, eq, gte, isNotNull, lt } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { sendExpiryReminderEmail } from '@/libs/email/sendSubscriptionEmails';
import type { ExpiryDaysRemaining } from '@/libs/email/types';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { createAdminClient } from '@/libs/supabase/admin';
import { subscriptionTiers, userSubscriptions } from '@/models/Schema';

import { inngest } from '../client';

type CronLogger = { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

type WindowKind = 't_minus_3' | 'day_of' | 't_plus_1';

function windowBounds(kind: WindowKind, now: Date): { start: Date; end: Date } {
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayMs = 24 * 60 * 60 * 1000;
  if (kind === 't_minus_3') {
    // expiry falls 3 days from today (UTC)
    return {
      start: new Date(startOfDay.getTime() + 3 * dayMs),
      end: new Date(startOfDay.getTime() + 4 * dayMs),
    };
  }
  if (kind === 't_plus_1') {
    // expiry was yesterday — user has been demoted by the force-expire cron
    return {
      start: new Date(startOfDay.getTime() - dayMs),
      end: startOfDay,
    };
  }
  // day_of: expiry in [today, tomorrow)
  return {
    start: startOfDay,
    end: new Date(startOfDay.getTime() + dayMs),
  };
}

/**
 * For T-3 / day-of we look at users still in the trial window (status='trial').
 * For T+1 we look at users demoted yesterday (status='expired') — the
 * force-expire cron flipped status but kept trial_expires_at populated.
 */
function trialStatusForWindow(kind: WindowKind): 'trial' | 'expired' {
  return kind === 't_plus_1' ? 'expired' : 'trial';
}

async function fetchUserEmail(userId: string): Promise<{ email: string; name?: string } | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) {
      return null;
    }
    const meta = data.user.user_metadata as Record<string, unknown> | undefined;
    const name = typeof meta?.display_name === 'string'
      ? meta.display_name
      : typeof meta?.full_name === 'string'
        ? meta.full_name
        : undefined;
    return { email: data.user.email, name };
  } catch (err) {
    logger.error({ err, userId }, 'expiry-warnings: failed to fetch user');
    return null;
  }
}

/** Display name of the paid tier users can upgrade to (for email copy). */
async function getPaidTierName(): Promise<string> {
  const [tier] = await db
    .select({ displayName: subscriptionTiers.displayName, name: subscriptionTiers.name })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.name, 'pro'))
    .limit(1);
  return tier?.displayName ?? tier?.name ?? 'Pro';
}

async function processTrials(
  windowKind: WindowKind,
  daysRemaining: ExpiryDaysRemaining,
  now: Date,
  tierName: string,
): Promise<number> {
  const { start, end } = windowBounds(windowKind, now);

  const rows = await db
    .select({
      userId: userSubscriptions.userId,
      lastSentAt: userSubscriptions.lastTrialWarningSentAt,
    })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, trialStatusForWindow(windowKind)),
        isNotNull(userSubscriptions.trialExpiresAt),
        gte(userSubscriptions.trialExpiresAt, start),
        lt(userSubscriptions.trialExpiresAt, end),
      ),
    );

  let sent = 0;
  for (const row of rows) {
    // Idempotency: skip if we've already sent a warning in the last 12h.
    if (row.lastSentAt && row.lastSentAt > new Date(now.getTime() - 12 * 60 * 60 * 1000)) {
      continue;
    }
    const userInfo = await fetchUserEmail(row.userId);
    if (!userInfo) {
      continue;
    }
    sendExpiryReminderEmail({
      email: userInfo.email,
      name: userInfo.name,
      tierName,
      kind: 'trial',
      daysRemaining,
    });
    await db
      .update(userSubscriptions)
      .set({ lastTrialWarningSentAt: new Date(), updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, row.userId));
    sent++;
  }
  return sent;
}

async function processPromotions(
  windowKind: WindowKind,
  daysRemaining: ExpiryDaysRemaining,
  now: Date,
  tierName: string,
): Promise<number> {
  const { start, end } = windowBounds(windowKind, now);

  // Tier filter:
  //   T-3 / day-of: user is still on the promotion tier (active)
  //   T+1: force-expire cron has flipped tier to free; expires_at remains
  //        populated so we can still find them. Match by free tier id +
  //        status='expired' (paid cancellation uses status='cancelled' and nulls
  //        expires_at, so there's no overlap).
  const tierName2 = windowKind === 't_plus_1' ? 'free' : 'promotion';
  const [tier] = await db
    .select({ id: subscriptionTiers.id })
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.name, tierName2))
    .limit(1);

  if (!tier) {
    return 0;
  }

  const tierFilter = windowKind === 't_plus_1'
    ? and(
        eq(userSubscriptions.tierId, tier.id),
        eq(userSubscriptions.status, 'expired'),
      )
    : eq(userSubscriptions.tierId, tier.id);

  const rows = await db
    .select({
      userId: userSubscriptions.userId,
      lastSentAt: userSubscriptions.lastPromotionWarningSentAt,
    })
    .from(userSubscriptions)
    .where(
      and(
        tierFilter,
        isNotNull(userSubscriptions.expiresAt),
        gte(userSubscriptions.expiresAt, start),
        lt(userSubscriptions.expiresAt, end),
      ),
    );

  let sent = 0;
  for (const row of rows) {
    if (row.lastSentAt && row.lastSentAt > new Date(now.getTime() - 12 * 60 * 60 * 1000)) {
      continue;
    }
    const userInfo = await fetchUserEmail(row.userId);
    if (!userInfo) {
      continue;
    }
    sendExpiryReminderEmail({
      email: userInfo.email,
      name: userInfo.name,
      tierName,
      kind: 'promotion',
      daysRemaining,
    });
    await db
      .update(userSubscriptions)
      .set({ lastPromotionWarningSentAt: new Date(), updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, row.userId));
    sent++;
  }
  return sent;
}

/**
 * Cron body — extracted as a named export so tests can exercise it directly.
 *
 * @internal
 */
export async function sendExpiryWarnings(cronLogger: CronLogger): Promise<{
  trialsT3: number;
  trialsDay0: number;
  trialsT1: number;
  promotionsT3: number;
  promotionsDay0: number;
  promotionsT1: number;
}> {
  const now = new Date();
  const tierName = await getPaidTierName();
  const trialsT3 = await processTrials('t_minus_3', 3, now, tierName);
  const trialsDay0 = await processTrials('day_of', 0, now, tierName);
  const trialsT1 = await processTrials('t_plus_1', -1, now, tierName);
  const promotionsT3 = await processPromotions('t_minus_3', 3, now, tierName);
  const promotionsDay0 = await processPromotions('day_of', 0, now, tierName);
  const promotionsT1 = await processPromotions('t_plus_1', -1, now, tierName);

  const result = { trialsT3, trialsDay0, trialsT1, promotionsT3, promotionsDay0, promotionsT1 };
  cronLogger.info('expiry-warnings: done', result);
  return result;
}

/**
 * Daily cron: sends T-3 / day-of / T+1 expiry-warning emails for trials and
 * promotions, with a 12h idempotency guard per user.
 *
 * Gated by ENABLE_REVERSE_TRIAL (opt-in). Runs at 09:00 UTC, BEFORE the
 * force-expire cron (10:00) so the warning lands before the demotion.
 */
export const trialPromotionExpiryWarningsFunction = inngest.createFunction(
  {
    id: 'trial-promotion-expiry-warnings',
    name: 'Trial & Promotion Expiry Warnings',
    triggers: [{ cron: '0 9 * * *' }],
  },
  async ({ logger: cronLogger }) => {
    if (Env.ENABLE_REVERSE_TRIAL !== 'true') {
      cronLogger.info('expiry-warnings: skipped (ENABLE_REVERSE_TRIAL is off)');
      return {
        trialsT3: 0,
        trialsDay0: 0,
        trialsT1: 0,
        promotionsT3: 0,
        promotionsDay0: 0,
        promotionsT1: 0,
      };
    }
    return sendExpiryWarnings(cronLogger);
  },
);
