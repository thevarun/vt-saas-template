// @vitest-environment node
//
// Focused coverage for the `isStripeManaged` flag on the subscription payload:
// it is true exactly when the user's row carries a live stripe_subscription_id,
// letting the UI route Stripe-billed users to the portal vs. an upgrade CTA.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockGetUsageBatch = vi.fn();
vi.mock('@/libs/subscriptions/usage', () => ({
  getUsageBatch: (...a: unknown[]) => mockGetUsageBatch(...a),
}));

vi.mock('@/libs/subscriptions/period', () => ({
  getCurrentPeriod: () => ({ start: new Date('2026-01-01'), end: new Date('2026-01-31') }),
  toDateString: (d: Date) => d.toISOString().slice(0, 10),
}));

// db.select() is called three times in order:
//   1. the user's subscription (+tier) join   → subQuery
//   2. the public plan catalogue              → allTiersQuery
//   3. the user-tier quota rows               → quotaRows
// Each call returns a fresh thenable chain that resolves to the next queued
// result, so query builder shape (innerJoin/where/orderBy/limit) is irrelevant.
let selectResults: unknown[][] = [];
let selectIdx = 0;

function makeChain(): Record<string, unknown> {
  const rows = selectResults[selectIdx] ?? [];
  selectIdx++;
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown) => resolve(rows),
  };
  for (const m of ['from', 'innerJoin', 'where', 'orderBy', 'limit']) {
    chain[m] = () => chain;
  }
  return chain;
}

vi.mock('@/libs/DB', () => ({
  db: { select: () => makeChain() },
}));

const { getSubscriptionUsage } = await import('./get-subscription-usage');

const freeTierRow = {
  id: 'tier-free',
  name: 'free',
  displayName: 'Free',
  description: null,
  priceCents: 0,
  resourceType: 'tokens',
  premiumUnitKey: null,
  premiumPeriodLimit: 0,
  fallbackUnitKey: 'requests',
  fallbackPeriodLimit: 10,
};

function subRow(overrides: Record<string, unknown>) {
  return {
    tierId: 'tier-pro',
    status: 'active',
    trialExpiresAt: null,
    currentPeriodAnchorAt: new Date('2026-01-01'),
    startedAt: new Date('2026-01-01'),
    expiresAt: null,
    hasTrialed: true,
    billingInterval: 'monthly',
    stripeSubscriptionId: null,
    tierName: 'pro',
    tierDisplayName: 'Pro',
    tierDescription: null,
    tierPriceCents: 1000,
    ...overrides,
  };
}

describe('getSubscriptionUsage — isStripeManaged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectIdx = 0;
    mockGetUsageBatch.mockResolvedValue(new Map());
  });

  it('is true when the subscription has a stripe_subscription_id', async () => {
    selectResults = [
      [subRow({ stripeSubscriptionId: 'sub_live_123' })],
      [freeTierRow],
      [],
    ];

    const result = await getSubscriptionUsage('user-1');

    expect(result?.subscription.isStripeManaged).toBe(true);
  });

  it('is false when stripe_subscription_id is null (manual/promo/trial-only)', async () => {
    selectResults = [
      [subRow({ stripeSubscriptionId: null })],
      [freeTierRow],
      [],
    ];

    const result = await getSubscriptionUsage('user-1');

    expect(result?.subscription.isStripeManaged).toBe(false);
  });

  it('is false for the free-tier fallback (no subscription row)', async () => {
    selectResults = [
      [], // no subscription
      [freeTierRow],
      [],
    ];

    const result = await getSubscriptionUsage('user-1');

    expect(result?.tier.name).toBe('free');
    expect(result?.subscription.isStripeManaged).toBe(false);
  });
});
