// @vitest-environment node
import type { SQL } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Schema modules read DB_SCHEMA at import time; this worktree has no .env.local,
// so set it before any import that pulls in the schema.
vi.hoisted(() => {
  process.env.DB_SCHEMA ??= 'vt_saas';
  process.env.NEXT_PUBLIC_DB_SCHEMA ??= 'vt_saas';
});

const capturedWheres: SQL[] = [];

// Mock the Drizzle client. Every .select(...).from(table) returns a thenable
// query builder: tier lookups resolve to fixture rows; the trial + promotion
// queries capture their .where() predicate and resolve to no rows (so no
// transitions run — this test only asserts on the predicate shape).
vi.mock('@/libs/DB', () => {
  const tierRows = [
    { id: 'free-tier', name: 'free' },
    { id: 'promo-tier', name: 'promotion' },
  ];

  function makeBuilder(rows: unknown[]) {
    const builder: Record<string, unknown> = {};
    builder.from = vi.fn(() => builder);
    builder.where = vi.fn((predicate: SQL) => {
      capturedWheres.push(predicate);
      return Promise.resolve([]);
    });
    // The tier lookup (.select().from(subscriptionTiers)) is awaited directly
    // without .where(), so the builder itself must be thenable.
    builder.then = (resolve: (v: unknown[]) => unknown) => resolve(rows);
    return builder;
  }

  return {
    db: {
      select: vi.fn(() => makeBuilder(tierRows)),
      selectDistinct: vi.fn(() => makeBuilder([])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
    },
  };
});

vi.mock('@/libs/Env', () => ({
  Env: { ENABLE_REVERSE_TRIAL: 'true' },
}));

vi.mock('@/libs/analytics/server', () => ({
  trackEventServer: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/libs/jobs/blocking', () => ({
  blockScheduledTasksForUser: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/libs/subscriptions/quota', () => ({
  invalidateQuotaCache: vi.fn(),
}));

const mockLogger = { info: vi.fn(), error: vi.fn() };

describe('forceExpireTrialsAndPromotions — Stripe guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedWheres.length = 0;
  });

  it('skips rows with a non-null stripe_subscription_id in BOTH the trial and promotion queries', async () => {
    const { PgDialect } = await import('drizzle-orm/pg-core');
    const { forceExpireTrialsAndPromotions } = await import(
      './force-expire-trials-and-promotions',
    );

    await forceExpireTrialsAndPromotions(mockLogger);

    // Two predicate-bearing queries: trial-expiry, then promotion-expiry.
    expect(capturedWheres).toHaveLength(2);

    const dialect = new PgDialect();
    for (const where of capturedWheres) {
      const { sql } = dialect.sqlToQuery(where);

      // The guard ensures Stripe-managed subscriptions are never demoted.
      expect(sql).toMatch(/"stripe_subscription_id"\s+is null/i);
    }
  });
});
