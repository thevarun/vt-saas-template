import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuotaDecision } from './quota';

// Mock DB module before imports.
vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock Logger to suppress output.
vi.mock('@/libs/Logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock analytics server (checkQuota emits quota_limit_reached / trial_expired).
vi.mock('@/libs/analytics/server', () => ({
  trackEventServer: vi.fn().mockResolvedValue(undefined),
}));

// Mock usage module.
vi.mock('./usage', () => ({
  getUsage: vi.fn(),
}));

// Mock blocking helper (called from the lazy-expiry path).
vi.mock('@/libs/jobs/blocking', () => ({
  blockScheduledTasksForUser: vi.fn().mockResolvedValue(0),
}));

// Import after mocks.
const { db } = await import('@/libs/DB');
const { getUsage } = await import('./usage');
const { checkQuotaByUserId, clearQuotaCache, invalidateQuotaCache } = await import('./quota');

// Generic two-pool unit keys (a product maps these to its own meter — model ids,
// rate-limit buckets, …).
const PREMIUM_KEY = 'premium-pool';
const FALLBACK_KEY = 'fallback-pool';

function mockSubscriptionQuery(rows: unknown[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

function mockTierRow(overrides: Record<string, unknown> = {}) {
  return {
    status: 'active',
    trialExpiresAt: null,
    expiresAt: null,
    currentPeriodAnchorAt: new Date('2026-04-30T00:00:00Z'),
    startedAt: new Date('2026-04-30T00:00:00Z'),
    tierName: 'pro',
    premiumUnitKey: PREMIUM_KEY,
    premiumPeriodLimit: 150000,
    fallbackUnitKey: FALLBACK_KEY,
    fallbackPeriodLimit: 250000,
    warningThresholdPct: 90,
    ...overrides,
  };
}

describe('checkQuotaByUserId', () => {
  beforeEach(() => {
    clearQuotaCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearQuotaCache();
  });

  it('returns premium pool when usage is below threshold (Pro tier)', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 100000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-1', 'generation');

    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(PREMIUM_KEY);
    expect(result.premiumUnitKey).toBe(PREMIUM_KEY);
    expect(result.usagePct.premium).toBeCloseTo(66.67, 1);
    expect(result.warning).toBeUndefined();
    expect(result.downgrade).toBeUndefined();
  });

  it('returns warning when premium usage exceeds threshold (90%)', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 140000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-2', 'generation');

    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(PREMIUM_KEY);
    expect(result.warning).toBeDefined();
    expect(result.warning?.type).toBe('approaching_premium_limit');
    expect(result.warning?.usage_pct).toBeCloseTo(93.33, 1);
    expect(result.downgrade).toBeUndefined();
  });

  it('returns fallback pool with downgrade when premium is exhausted', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 160000,
      fallbackUnitsUsed: 50000,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-3', 'generation');

    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(FALLBACK_KEY);
    expect(result.downgrade).toBeDefined();
    expect(result.downgrade?.reason).toBe('premium_exhausted');
    expect(result.downgrade?.current_unit_key).toBe(FALLBACK_KEY);
    expect(result.warning).toBeUndefined();
  });

  it('returns allowed: false when both limits are exhausted', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 165000,
      fallbackUnitsUsed: 260000,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-4', 'generation');

    expect(result.allowed).toBe(false);
    expect(result.unitKey).toBe(FALLBACK_KEY);
    expect(result.usagePct.premium).toBeGreaterThan(100);
    expect(result.usagePct.fallback).toBeGreaterThan(100);
  });

  it('returns fallback pool for free tier (premium limit = 0)', async () => {
    mockSubscriptionQuery([mockTierRow({
      tierName: 'free',
      premiumUnitKey: null,
      premiumPeriodLimit: 0,
      fallbackUnitKey: FALLBACK_KEY,
      fallbackPeriodLimit: 25000,
    })]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 0,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-5', 'generation');

    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(FALLBACK_KEY);
    expect(result.premiumUnitKey).toBeNull();
    expect(result.downgrade).toBeUndefined();
  });

  it('returns allowed: false for free tier when fallback is exhausted', async () => {
    mockSubscriptionQuery([mockTierRow({
      tierName: 'free',
      premiumUnitKey: null,
      premiumPeriodLimit: 0,
      fallbackUnitKey: FALLBACK_KEY,
      fallbackPeriodLimit: 25000,
    })]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 0,
      fallbackUnitsUsed: 26000,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-6', 'generation');

    expect(result.allowed).toBe(false);
  });

  // Zero-limit pools must block: a tier disables a resource entirely by setting
  // both period limits to 0. Treating that as "non-exhaustible" would silently
  // allow unlimited usage.
  it('returns allowed: false when both pools have zero period limit (blocked-tier pattern)', async () => {
    mockSubscriptionQuery([mockTierRow({
      tierName: 'free',
      premiumUnitKey: null,
      premiumPeriodLimit: 0,
      fallbackUnitKey: FALLBACK_KEY,
      fallbackPeriodLimit: 0,
    })]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 0,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-zero-limit', 'restricted_resource');

    expect(result.allowed).toBe(false);
  });

  it('handles expired trial by updating tier_id to free tier and returning free-tier quota', async () => {
    const expiredTrialRow = mockTierRow({
      status: 'trial',
      trialExpiresAt: new Date('2026-01-01T00:00:00Z'), // well in the past
    });

    const FREE_TIER_ID = 'tier-free-id';

    // db.select is called multiple times:
    //   1. subscription query (returns expired trial)
    //   2. free tier lookup (returns free tier row with id)
    //   3. subscription query again on recursion (returns free tier)
    let selectCallCount = 0;
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([expiredTrialRow]);
        }
        if (selectCallCount === 2) {
          return Promise.resolve([{ id: FREE_TIER_ID }]);
        }
        return Promise.resolve([mockTierRow({
          status: 'expired',
          tierName: 'free',
          premiumUnitKey: null,
          premiumPeriodLimit: 0,
          fallbackUnitKey: FALLBACK_KEY,
          fallbackPeriodLimit: 25000,
        })]);
      }),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const updateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain);

    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 0,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-7', 'generation');

    expect(db.update).toHaveBeenCalled();
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'expired',
        tierId: FREE_TIER_ID,
      }),
    );
    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(FALLBACK_KEY);
  });

  // Regression: an expired trial whose 'free' tier is missing from the DB (fresh
  // install without seed.sql) must throw a recoverable error rather than recurse
  // forever. expireTrialToFree returns false (no row mutation), so loadUserQuotaState
  // must NOT re-enter the same expiry branch.
  it('throws (does NOT infinite-loop) on expired trial when free tier is missing', async () => {
    const expiredTrialRow = mockTierRow({
      status: 'trial',
      trialExpiresAt: new Date('2026-01-01T00:00:00Z'),
    });

    // db.select call sequence:
    //   1. subscription query → expired trial
    //   2. getTierIdByName('free') → [] (free tier missing)
    // After (2) returns empty, expireTrialToFree returns false and the caller
    // throws. There must be NO third select (no recursion).
    let selectCallCount = 0;
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([expiredTrialRow]);
        }
        // Free-tier lookup (and any further call) returns empty.
        return Promise.resolve([]);
      }),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    // db.update is never reached (free tier missing → no demotion write).
    const updateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    (db.update as ReturnType<typeof vi.fn>).mockReturnValue(updateChain);

    await expect(checkQuotaByUserId('user-no-free', 'generation')).rejects.toThrow(
      /free tier is missing from DB/,
    );

    // Exactly 2 selects: the subscription read + the free-tier lookup. A third
    // would mean we recursed (the bug).
    expect(selectCallCount).toBe(2);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('degrades to free tier row when no subscription found', async () => {
    let selectCallCount = 0;
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return Promise.resolve([]);
        }
        return Promise.resolve([{
          tierName: 'free',
          premiumUnitKey: null,
          premiumPeriodLimit: 0,
          fallbackUnitKey: FALLBACK_KEY,
          fallbackPeriodLimit: 25000,
          warningThresholdPct: 90,
        }]);
      }),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const result = await checkQuotaByUserId('user-8', 'generation');

    expect(result.allowed).toBe(true);
    expect(result.unitKey).toBe(FALLBACK_KEY);
    expect(result.premiumUnitKey).toBeNull();
  });

  it('returns cached result on cache hit without making DB calls', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 50000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const first = await checkQuotaByUserId('user-9', 'generation');

    expect(first.allowed).toBe(true);

    vi.clearAllMocks();

    const second = await checkQuotaByUserId('user-9', 'generation');

    expect(second.allowed).toBe(first.allowed);
    expect(second.unitKey).toBe(first.unitKey);
    expect(db.select).not.toHaveBeenCalled();
    expect(getUsage).not.toHaveBeenCalled();
  });

  it('invalidateQuotaCache clears the cache for a user+resource', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 50000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    await checkQuotaByUserId('user-10', 'generation');
    vi.clearAllMocks();

    invalidateQuotaCache('user-10', 'generation');

    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 50000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    await checkQuotaByUserId('user-10', 'generation');

    expect(db.select).toHaveBeenCalled();
  });

  it('includes resetsAt in all results', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 50000,
      fallbackUnitsUsed: 0,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result: QuotaDecision = await checkQuotaByUserId('user-11', 'generation');

    expect(result.resetsAt).toBeInstanceOf(Date);
  });

  it('enforce:false returns allowed:true even when both pools are exhausted', async () => {
    mockSubscriptionQuery([mockTierRow()]);
    vi.mocked(getUsage).mockResolvedValue({
      premiumUnitsUsed: 165000,
      fallbackUnitsUsed: 260000,
      periodStart: '2026-03-01',
      periodEnd: '2026-03-15',
    });

    const result = await checkQuotaByUserId('user-12', 'generation', { enforce: false });

    expect(result.allowed).toBe(true);
    // Even though allowed is forced true, pool selection still surfaces fallback
    // because premium is exhausted.
    expect(result.unitKey).toBe(FALLBACK_KEY);
    expect(result.usagePct.premium).toBeGreaterThan(100);
  });
});
