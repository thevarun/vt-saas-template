// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// The recordUsage path runs:
//   1. db.select(...).from(userSubscriptions).where(...).limit(1)   ← anchor lookup
//   2. db.insert(resourceUsage).values(...).onConflictDoUpdate(...) ← the upsert we retry
const mockInsertOnConflict = vi.fn();
const mockInsertValues = vi.fn((..._a: unknown[]) => ({ onConflictDoUpdate: mockInsertOnConflict }));
const mockInsert = vi.fn((..._a: unknown[]) => ({ values: mockInsertValues }));

const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn((..._a: unknown[]) => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn((..._a: unknown[]) => ({ where: mockSelectWhere }));
const mockSelect = vi.fn((..._a: unknown[]) => ({ from: mockSelectFrom }));

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

vi.mock('@/models/Schema', () => ({
  resourceUsage: {
    userId: 'user_id',
    resourceType: 'resource_type',
    periodStart: 'period_start',
    premiumUnitsUsed: 'premium_units_used',
    fallbackUnitsUsed: 'fallback_units_used',
  },
  userSubscriptions: {
    userId: 'user_id',
    currentPeriodAnchorAt: 'current_period_anchor_at',
    startedAt: 'started_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((...args: unknown[]) => args),
  inArray: vi.fn((...args: unknown[]) => args),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    {},
  ),
}));

// Import after mocks
const { recordUsage } = await import('./usage');

const PREMIUM_KEY = 'premium-pool';

function pgError(code: string): Error & { code: string } {
  const err = new Error(`pg error ${code}`) as Error & { code: string };
  err.code = code;
  return err;
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: anchor lookup returns a usable date
  mockSelectLimit.mockResolvedValue([{ currentPeriodAnchorAt: new Date('2026-01-01'), startedAt: new Date('2026-01-01') }]);
});

describe('recordUsage retry behavior', () => {
  it('returns early without inserting when units <= 0', async () => {
    await recordUsage('u1', 'generation', PREMIUM_KEY, 0, PREMIUM_KEY);

    expect(mockInsert).not.toHaveBeenCalled();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('succeeds on first attempt when upsert resolves', async () => {
    mockInsertOnConflict.mockResolvedValueOnce(undefined);

    await recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY);

    expect(mockInsertOnConflict).toHaveBeenCalledOnce();
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('retries once on transient 40P01 (deadlock_detected) and succeeds', async () => {
    mockInsertOnConflict
      .mockRejectedValueOnce(pgError('40P01'))
      .mockResolvedValueOnce(undefined);

    await recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY);

    expect(mockInsertOnConflict).toHaveBeenCalledTimes(2);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('retries once on transient 40001 (serialization_failure) and succeeds', async () => {
    mockInsertOnConflict
      .mockRejectedValueOnce(pgError('40001'))
      .mockResolvedValueOnce(undefined);

    await recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY);

    expect(mockInsertOnConflict).toHaveBeenCalledTimes(2);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('captures Sentry warning when transient errors persist across both attempts', async () => {
    mockInsertOnConflict
      .mockRejectedValueOnce(pgError('40P01'))
      .mockRejectedValueOnce(pgError('40P01'));

    // Must NOT throw — recordUsage swallows to keep the user request alive.
    await expect(
      recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY),
    ).resolves.toBeUndefined();

    expect(mockInsertOnConflict).toHaveBeenCalledTimes(2);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'recordUsage failed after retry',
      expect.objectContaining({
        level: 'warning',
        extra: expect.objectContaining({
          userId: 'u1',
          resourceType: 'generation',
          errorCode: '40P01',
        }),
      }),
    );
  });

  it('does NOT retry on non-transient errors (e.g. 23505 unique_violation) and emits Sentry warning', async () => {
    mockInsertOnConflict.mockRejectedValueOnce(pgError('23505'));

    await expect(
      recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY),
    ).resolves.toBeUndefined();

    expect(mockInsertOnConflict).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'recordUsage failed after retry',
      expect.objectContaining({
        level: 'warning',
        extra: expect.objectContaining({ errorCode: '23505' }),
      }),
    );
  });

  it('does NOT retry on errors without a pg code (generic JS Error) and emits Sentry warning', async () => {
    mockInsertOnConflict.mockRejectedValueOnce(new Error('boom'));

    await expect(
      recordUsage('u1', 'generation', PREMIUM_KEY, 100, PREMIUM_KEY),
    ).resolves.toBeUndefined();

    expect(mockInsertOnConflict).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledOnce();
  });
});
