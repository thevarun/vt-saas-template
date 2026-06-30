import { and, eq, isNotNull, lt } from 'drizzle-orm';

import { trackEventServer } from '@/libs/analytics/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { blockScheduledTasksForUser } from '@/libs/jobs/blocking';
import { invalidateQuotaCache } from '@/libs/subscriptions/quota';
import { subscriptionTiers, tierQuotas, userSubscriptions } from '@/models/Schema';

import { inngest } from '../client';

type Logger = { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void };

/**
 * Invalidates every cached quota state for a user — iterates the resource types
 * defined across all tiers (the cache is keyed by user+resourceType).
 */
async function invalidateAllQuotaCaches(userId: string): Promise<void> {
  const rows = await db
    .selectDistinct({ resourceType: tierQuotas.resourceType })
    .from(tierQuotas);
  for (const { resourceType } of rows) {
    invalidateQuotaCache(userId, resourceType);
  }
}

async function transitionToFree(
  userId: string,
  freeTierId: string,
  reason: string,
): Promise<void> {
  // Deliberately keep trial_expires_at / expires_at populated so the T+1 expiry
  // email cron can still find these rows. The banner skips them because it gates
  // on status='trial' or tier='promotion', which both flip below.
  await db
    .update(userSubscriptions)
    .set({
      status: 'expired',
      tierId: freeTierId,
      currentPeriodAnchorAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.userId, userId));

  await blockScheduledTasksForUser(userId, reason);
  await invalidateAllQuotaCaches(userId);
}

/**
 * Cron body — extracted as a named export so tests can exercise it directly with
 * a plain logger double (matches the template's scheduled-tasks.ts pattern).
 *
 * @internal
 */
export async function forceExpireTrialsAndPromotions(logger: Logger): Promise<{
  expiredTrials: number;
  expiredPromotions: number;
}> {
  const now = new Date();

  // Resolve free + promotion tier IDs once.
  const tiers = await db
    .select({ id: subscriptionTiers.id, name: subscriptionTiers.name })
    .from(subscriptionTiers);

  const freeTierId = tiers.find(t => t.name === 'free')?.id;
  const promotionTierId = tiers.find(t => t.name === 'promotion')?.id;

  if (!freeTierId) {
    logger.error('force-expire: free tier not found in DB');
    return { expiredTrials: 0, expiredPromotions: 0 };
  }

  // 1. Trials whose trial_expires_at has passed.
  const expiredTrialRows = await db
    .select({ userId: userSubscriptions.userId })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, 'trial'),
        isNotNull(userSubscriptions.trialExpiresAt),
        lt(userSubscriptions.trialExpiresAt, now),
      ),
    );

  let expiredTrials = 0;
  for (const row of expiredTrialRows) {
    try {
      await transitionToFree(row.userId, freeTierId, 'trial_expired');
      expiredTrials++;

      trackEventServer(
        'trial_expired',
        { trigger_source: 'cron' },
        row.userId,
      ).catch(err => logger.error('trial_expired tracking failed', { userId: row.userId, err }));
    } catch (err) {
      logger.error('force-expire: trial transition failed', { userId: row.userId, err });
    }
  }

  // 2. Promotions whose expires_at has passed.
  let expiredPromotions = 0;
  if (promotionTierId) {
    const expiredPromotionRows = await db
      .select({ userId: userSubscriptions.userId })
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.tierId, promotionTierId),
          isNotNull(userSubscriptions.expiresAt),
          lt(userSubscriptions.expiresAt, now),
        ),
      );

    for (const row of expiredPromotionRows) {
      try {
        await transitionToFree(row.userId, freeTierId, 'promotion_expired');
        expiredPromotions++;
      } catch (err) {
        logger.error('force-expire: promotion transition failed', { userId: row.userId, err });
      }
    }
  }

  logger.info('force-expire: done', { expiredTrials, expiredPromotions });
  return { expiredTrials, expiredPromotions };
}

/**
 * Daily cron: demotes expired trials + promotions to the free tier, blocks their
 * pending scheduled tasks, and invalidates their quota caches.
 *
 * Gated by ENABLE_REVERSE_TRIAL — reverse-trial is opt-in, so this no-ops when
 * the flag is off. Runs at 10:00 UTC, after the expiry-warning cron (09:00).
 */
export const forceExpireTrialsAndPromotionsFunction = inngest.createFunction(
  {
    id: 'force-expire-trials-and-promotions',
    name: 'Force Expire Trials & Promotions',
    triggers: [{ cron: '0 10 * * *' }],
  },
  async ({ logger }) => {
    if (Env.ENABLE_REVERSE_TRIAL !== 'true') {
      logger.info('force-expire: skipped (ENABLE_REVERSE_TRIAL is off)');
      return { expiredTrials: 0, expiredPromotions: 0 };
    }
    return forceExpireTrialsAndPromotions(logger);
  },
);
