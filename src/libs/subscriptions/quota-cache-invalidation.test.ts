// @vitest-environment node
//
// Integration test for the quota-cache invalidation contract between recordUsage
// (usage.ts) and checkQuota (quota.ts):
//
//   checkQuota → recordUsage → checkQuota
//
// must reflect the newly-recorded usage on the SECOND checkQuota, even though
// quota state is cached for CACHE_TTL_MS (60s). Without recordUsage invalidating
// the cache, the second checkQuota would read the stale pre-write counts for the
// rest of the window — a stale-window over-spend.
//
// This exercises the REAL recordUsage, getUsage, and checkQuota against a tiny
// in-memory usage ledger driven through the mocked db, so the cache + invalidation
// path is genuinely wired (not mocked away).
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── In-memory usage ledger the mocked db reads/writes ──────────────────────────
const ledger = { premiumUsed: 0, fallbackUsed: 0 };

const PREMIUM_KEY = 'premium-pool';
const FALLBACK_KEY = 'fallback-pool';
const PREMIUM_LIMIT = 1000;
const FALLBACK_LIMIT = 1000;
const ANCHOR = new Date('2026-04-30T00:00:00Z');

// The mocked db dispatches based on which select-shape / insert is requested.
// We can't see the table from the chain, so we disambiguate by call order within
// each public call:
//   - loadUserQuotaState issues ONE joined select (innerJoin present) → tier row.
//   - getUsage issues ONE select (no innerJoin) → usage row.
//   - getPeriodAnchor (inside recordUsage) issues ONE select (no innerJoin) → anchor.
// We tag the chain by whether innerJoin was called.

function makeSelectChain() {
  let usedInnerJoin = false;
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => {
      usedInnerJoin = true;
      return chain;
    }),
    where: vi.fn(() => chain),
    limit: vi.fn(() => {
      if (usedInnerJoin) {
        // Joined tier+quota row for loadUserQuotaState.
        return Promise.resolve([{
          status: 'active',
          trialExpiresAt: null,
          expiresAt: null,
          currentPeriodAnchorAt: ANCHOR,
          startedAt: ANCHOR,
          tierName: 'pro',
          premiumUnitKey: PREMIUM_KEY,
          premiumPeriodLimit: PREMIUM_LIMIT,
          fallbackUnitKey: FALLBACK_KEY,
          fallbackPeriodLimit: FALLBACK_LIMIT,
          warningThresholdPct: 90,
        }]);
      }
      // Non-joined select. Two callers:
      //   getPeriodAnchor selects currentPeriodAnchorAt/startedAt.
      //   getUsage selects premiumUnitsUsed/fallbackUnitsUsed.
      // Returning a row carrying BOTH satisfies whichever asked.
      return Promise.resolve([{
        currentPeriodAnchorAt: ANCHOR,
        startedAt: ANCHOR,
        premiumUnitsUsed: ledger.premiumUsed,
        fallbackUnitsUsed: ledger.fallbackUsed,
        periodStart: '2026-04-30',
        periodEnd: '2026-05-07',
      }]);
    }),
  };
  return chain;
}

const mockInsert = vi.fn(() => ({
  values: (vals: { premiumUnitsUsed?: number; fallbackUnitsUsed?: number }) => ({
    onConflictDoUpdate: () => {
      // Apply the write to the in-memory ledger so the next getUsage sees it.
      ledger.premiumUsed += vals.premiumUnitsUsed ?? 0;
      ledger.fallbackUsed += vals.fallbackUnitsUsed ?? 0;
      return Promise.resolve(undefined);
    },
  }),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: () => makeSelectChain(),
    insert: () => mockInsert(),
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/libs/analytics/server', () => ({
  trackEventServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/libs/jobs/blocking', () => ({
  blockScheduledTasksForUser: vi.fn().mockResolvedValue(0),
}));

vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }));

const { checkQuotaByUserId, clearQuotaCache } = await import('./quota');
const { recordUsage } = await import('./usage');

describe('recordUsage invalidates the quota cache (no stale-window over-spend)', () => {
  beforeEach(() => {
    clearQuotaCache();
    ledger.premiumUsed = 0;
    ledger.fallbackUsed = 0;
    vi.clearAllMocks();
  });

  it('checkQuota → recordUsage → checkQuota reflects the updated usage', async () => {
    // 1. First read: zero usage, premium pool, ~0%.
    const before = await checkQuotaByUserId('user-cache', 'generation');

    expect(before.allowed).toBe(true);
    expect(before.unitKey).toBe(PREMIUM_KEY);
    expect(before.usagePct.premium).toBe(0);

    // 2. Record premium usage. This must invalidate the cached state.
    await recordUsage('user-cache', 'generation', PREMIUM_KEY, 500, PREMIUM_KEY);

    expect(ledger.premiumUsed).toBe(500);

    // 3. Second read: WITHOUT cache invalidation this would still report 0%.
    //    With the fix it re-reads the ledger and reports 50%.
    const after = await checkQuotaByUserId('user-cache', 'generation');

    expect(after.usagePct.premium).toBe(50);
  });

  it('without invalidation a stale read would mask exhaustion — fix lets the gate fire', async () => {
    // Prime cache at 0 usage.
    const first = await checkQuotaByUserId('user-cache-2', 'generation');

    expect(first.allowed).toBe(true);

    // Consume the entire premium + fallback budget.
    await recordUsage('user-cache-2', 'generation', PREMIUM_KEY, PREMIUM_LIMIT, PREMIUM_KEY);
    await recordUsage('user-cache-2', 'generation', FALLBACK_KEY, FALLBACK_LIMIT, PREMIUM_KEY);

    // The fresh read must now block (both pools exhausted) — only possible because
    // each recordUsage invalidated the cached state.
    const after = await checkQuotaByUserId('user-cache-2', 'generation');

    expect(after.allowed).toBe(false);
  });
});
