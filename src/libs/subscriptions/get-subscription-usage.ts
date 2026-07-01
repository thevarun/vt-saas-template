import { and, asc, eq, ne } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { getCurrentPeriod, toDateString } from '@/libs/subscriptions/period';
import { getUsageBatch } from '@/libs/subscriptions/usage';
import {
  subscriptionTiers,
  tierQuotas,
  userSubscriptions,
} from '@/models/Schema';

/** Per-(tier, resource) quota config — the two-pool shape from `tier_quotas`. */
export type QuotaInfo = {
  resourceType: string;
  premiumUnitKey: string | null;
  premiumPeriodLimit: number;
  fallbackUnitKey: string;
  fallbackPeriodLimit: number;
  warningThresholdPct: number;
};

/** Units consumed this period for one resource type. */
export type UsageInfo = {
  premiumUnitsUsed: number;
  fallbackUnitsUsed: number;
};

/** Quota config for a tier in the public catalogue (no usage). */
export type TierQuotaInfo = {
  resourceType: string;
  premiumUnitKey: string | null;
  premiumPeriodLimit: number;
  fallbackUnitKey: string;
  fallbackPeriodLimit: number;
};

export type SubscriptionUsageResponse = {
  tier: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceCents: number | null;
  };
  subscription: {
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    trialExpiresAt: string | null;
    /**
     * Tier-end date — used for promotion expiry AND for paid users who set
     * cancel_at_period_end (they stay status='active' until this date, then get
     * downgraded by the deletion webhook).
     */
    expiresAt: string | null;
    hasTrialed: boolean;
    billingInterval: 'monthly' | 'yearly' | null;
    /**
     * True when the subscription is backed by a live Stripe subscription
     * (`stripe_subscription_id` is set) — i.e. the user manages billing through
     * Stripe rather than a free/promo/manually-granted tier. Lets the UI route
     * to the billing portal vs. a plain upgrade CTA.
     */
    isStripeManaged: boolean;
  };
  /**
   * Per-resource quota + usage for the user's current tier, keyed by
   * resource_type. Generic: whatever resource types the tier defines appear here
   * (vs a fixed set of named quota fields).
   */
  resources: Record<string, { quota: QuotaInfo; usage: UsageInfo }>;
  period: {
    start: string;
    end: string;
  };
  /** Public plan catalogue (active, non-promotion tiers) with their quota config. */
  allTiers: Array<{
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceCents: number | null;
    quotas: Record<string, TierQuotaInfo>;
  }>;
};

/**
 * Fetch the subscription + tier + quota + usage payload for a user. The single
 * read powering every subscription UI surface.
 *
 * Returns null on a fatal data-integrity issue (the free tier is missing).
 * Callers treat null as a 5xx-equivalent and surface a generic error.
 */
export async function getSubscriptionUsage(
  userId: string,
): Promise<SubscriptionUsageResponse | null> {
  if (!db) {
    logger.error('getSubscriptionUsage: db client not available');
    return null;
  }

  // --- Round-trip level 1 ---------------------------------------------------
  // The user's subscription (+tier) and the public plan catalogue are
  // independent reads; fetch together. The catalogue also serves the free-tier
  // fallback below (free is always an active, non-promotion tier).
  const subQuery = db
    .select({
      tierId: userSubscriptions.tierId,
      status: userSubscriptions.status,
      trialExpiresAt: userSubscriptions.trialExpiresAt,
      currentPeriodAnchorAt: userSubscriptions.currentPeriodAnchorAt,
      startedAt: userSubscriptions.startedAt,
      expiresAt: userSubscriptions.expiresAt,
      hasTrialed: userSubscriptions.hasTrialed,
      billingInterval: userSubscriptions.billingInterval,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      tierName: subscriptionTiers.name,
      tierDisplayName: subscriptionTiers.displayName,
      tierDescription: subscriptionTiers.description,
      tierPriceCents: subscriptionTiers.priceCents,
    })
    .from(userSubscriptions)
    .innerJoin(
      subscriptionTiers,
      eq(userSubscriptions.tierId, subscriptionTiers.id),
    )
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  const allTiersQuery = db
    .select({
      id: subscriptionTiers.id,
      name: subscriptionTiers.name,
      displayName: subscriptionTiers.displayName,
      description: subscriptionTiers.description,
      priceCents: subscriptionTiers.priceCents,
      resourceType: tierQuotas.resourceType,
      premiumUnitKey: tierQuotas.premiumUnitKey,
      premiumPeriodLimit: tierQuotas.premiumPeriodLimit,
      fallbackUnitKey: tierQuotas.fallbackUnitKey,
      fallbackPeriodLimit: tierQuotas.fallbackPeriodLimit,
    })
    .from(subscriptionTiers)
    .innerJoin(tierQuotas, eq(tierQuotas.tierId, subscriptionTiers.id))
    .where(
      and(
        eq(subscriptionTiers.isActive, true),
        ne(subscriptionTiers.name, 'promotion'),
      ),
    )
    .orderBy(asc(subscriptionTiers.sortOrder));

  const [subRows, allTierRows] = await Promise.all([subQuery, allTiersQuery]);

  // Build the plan-catalogue map up-front so it can also serve the free-tier
  // fallback.
  type AllTier = SubscriptionUsageResponse['allTiers'][number];
  const tierMap = new Map<string, AllTier>();

  for (const row of allTierRows) {
    let tier = tierMap.get(row.id);
    if (!tier) {
      tier = {
        id: row.id,
        name: row.name,
        displayName: row.displayName,
        description: row.description,
        priceCents: row.priceCents,
        quotas: {},
      };
      tierMap.set(row.id, tier);
    }
    tier.quotas[row.resourceType] = {
      resourceType: row.resourceType,
      premiumUnitKey: row.premiumUnitKey,
      premiumPeriodLimit: row.premiumPeriodLimit,
      fallbackUnitKey: row.fallbackUnitKey,
      fallbackPeriodLimit: row.fallbackPeriodLimit,
    };
  }

  // Resolve the user's tier — from their subscription, or the free tier from the
  // catalogue map when they have none.
  let tierData: {
    tierId: string;
    status: string;
    trialExpiresAt: Date | null;
    currentPeriodAnchorAt: Date | null;
    startedAt: Date;
    expiresAt: Date | null;
    hasTrialed: boolean;
    billingInterval: 'monthly' | 'yearly' | null;
    stripeSubscriptionId: string | null;
    tierName: string;
    tierDisplayName: string;
    tierDescription: string | null;
    tierPriceCents: number | null;
  };

  if (subRows.length === 0 || !subRows[0]) {
    const freeTier = [...tierMap.values()].find(t => t.name === 'free');
    if (!freeTier) {
      logger.error('getSubscriptionUsage: free tier not found in DB');
      return null;
    }
    const now = new Date();
    tierData = {
      tierId: freeTier.id,
      status: 'active',
      trialExpiresAt: null,
      currentPeriodAnchorAt: now,
      startedAt: now,
      expiresAt: null,
      hasTrialed: false,
      billingInterval: null,
      stripeSubscriptionId: null,
      tierName: freeTier.name,
      tierDisplayName: freeTier.displayName,
      tierDescription: freeTier.description,
      tierPriceCents: freeTier.priceCents,
    };
  } else {
    tierData = subRows[0];
  }

  // --- Round-trip level 2 ---------------------------------------------------
  // The user-tier quota rows (queried directly — a 'promotion' tier is excluded
  // from the public catalogue above) and the current-period usage are
  // independent, so run them together.
  const anchor = tierData.currentPeriodAnchorAt ?? tierData.startedAt;
  const period = getCurrentPeriod(anchor);

  const quotaRows = await db
    .select({
      resourceType: tierQuotas.resourceType,
      premiumUnitKey: tierQuotas.premiumUnitKey,
      premiumPeriodLimit: tierQuotas.premiumPeriodLimit,
      fallbackUnitKey: tierQuotas.fallbackUnitKey,
      fallbackPeriodLimit: tierQuotas.fallbackPeriodLimit,
      warningThresholdPct: tierQuotas.warningThresholdPct,
    })
    .from(tierQuotas)
    .where(eq(tierQuotas.tierId, tierData.tierId));

  const resourceTypes = quotaRows.map(r => r.resourceType);
  const usageMap = await getUsageBatch(userId, resourceTypes, anchor);

  const resources: SubscriptionUsageResponse['resources'] = {};
  for (const q of quotaRows) {
    const usage = usageMap.get(q.resourceType);
    resources[q.resourceType] = {
      quota: {
        resourceType: q.resourceType,
        premiumUnitKey: q.premiumUnitKey,
        premiumPeriodLimit: q.premiumPeriodLimit,
        fallbackUnitKey: q.fallbackUnitKey,
        fallbackPeriodLimit: q.fallbackPeriodLimit,
        warningThresholdPct: q.warningThresholdPct,
      },
      usage: {
        premiumUnitsUsed: usage?.premiumUnitsUsed ?? 0,
        fallbackUnitsUsed: usage?.fallbackUnitsUsed ?? 0,
      },
    };
  }

  return {
    tier: {
      id: tierData.tierId,
      name: tierData.tierName,
      displayName: tierData.tierDisplayName,
      description: tierData.tierDescription,
      priceCents: tierData.tierPriceCents,
    },
    subscription: {
      status:
        tierData.status as SubscriptionUsageResponse['subscription']['status'],
      trialExpiresAt: tierData.trialExpiresAt?.toISOString() ?? null,
      expiresAt: tierData.expiresAt?.toISOString() ?? null,
      hasTrialed: tierData.hasTrialed,
      billingInterval: tierData.billingInterval,
      isStripeManaged: tierData.stripeSubscriptionId !== null,
    },
    resources,
    period: {
      start: toDateString(period.start),
      end: toDateString(period.end),
    },
    allTiers: [...tierMap.values()],
  };
}
