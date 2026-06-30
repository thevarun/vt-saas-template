import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuotaDecision } from '@/libs/subscriptions/quota';

// Mock the generic engine — these resolvers are a pure projection over it, so the
// test asserts the unitKey → modelId mapping and never the engine internals
// (cache, DB load, expiry, analytics are covered by quota.test.ts in subscriptions).
vi.mock('@/libs/subscriptions/quota', () => ({
  checkQuota: vi.fn(),
  checkQuotaByUserId: vi.fn(),
}));

const { checkQuota, checkQuotaByUserId } = await import('@/libs/subscriptions/quota');
const { getModelForUser, getModelByUserId } = await import('./quota');

const mockCheckQuota = vi.mocked(checkQuota);
const mockCheckQuotaByUserId = vi.mocked(checkQuotaByUserId);

const fakeUser = { id: 'user-123' } as any;
const resetsAt = new Date('2026-07-01T00:00:00Z');

function decision(overrides: Partial<QuotaDecision> = {}): QuotaDecision {
  return {
    allowed: true,
    unitKey: 'gpt-4o',
    premiumUnitKey: 'gpt-4o',
    usagePct: { premium: 10, fallback: 0 },
    resetsAt,
    ...overrides,
  };
}

describe('getModelForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps unitKey → modelId and premiumUnitKey → premiumModelId', async () => {
    mockCheckQuota.mockResolvedValue(decision({ unitKey: 'gpt-4o', premiumUnitKey: 'gpt-4o' }));

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.modelId).toBe('gpt-4o');
    expect(selection.premiumModelId).toBe('gpt-4o');
    expect(selection.usagePct).toEqual({ premium: 10, fallback: 0 });
    expect(selection.resetsAt).toBe(resetsAt);
  });

  it('passes through `allowed`', async () => {
    mockCheckQuota.mockResolvedValue(decision({ allowed: false, unitKey: 'gpt-4o-mini' }));

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.allowed).toBe(false);
    expect(selection.modelId).toBe('gpt-4o-mini');
  });

  it('passes through a usage warning unchanged', async () => {
    mockCheckQuota.mockResolvedValue(
      decision({
        warning: { type: 'approaching_premium_limit', usage_pct: 92, resets_at: resetsAt },
      }),
    );

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.warning).toEqual({
      type: 'approaching_premium_limit',
      usage_pct: 92,
      resets_at: resetsAt,
    });
  });

  it('projects downgrade.current_unit_key → current_model', async () => {
    mockCheckQuota.mockResolvedValue(
      decision({
        unitKey: 'gpt-4o-mini',
        downgrade: { reason: 'premium_exhausted', current_unit_key: 'gpt-4o-mini', resets_at: resetsAt },
      }),
    );

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.downgrade).toEqual({
      reason: 'premium_exhausted',
      current_model: 'gpt-4o-mini',
      resets_at: resetsAt,
    });
    expect(selection.modelId).toBe('gpt-4o-mini');
  });

  it('omits downgrade/warning when absent', async () => {
    mockCheckQuota.mockResolvedValue(decision());

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.downgrade).toBeUndefined();
    expect(selection.warning).toBeUndefined();
  });

  it('maps a null premiumUnitKey to a null premiumModelId', async () => {
    mockCheckQuota.mockResolvedValue(decision({ premiumUnitKey: null, unitKey: 'gpt-4o-mini' }));

    const selection = await getModelForUser(fakeUser, 'smart_generation');

    expect(selection.premiumModelId).toBeNull();
  });

  it('forwards the enforce option to the engine', async () => {
    mockCheckQuota.mockResolvedValue(decision());

    await getModelForUser(fakeUser, 'smart_generation', { enforce: false });

    expect(mockCheckQuota).toHaveBeenCalledWith(fakeUser, 'smart_generation', { enforce: false });
  });
});

describe('getModelByUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('projects via checkQuotaByUserId and forwards options', async () => {
    mockCheckQuotaByUserId.mockResolvedValue(decision({ unitKey: 'gpt-4o', premiumUnitKey: 'gpt-4o' }));

    const selection = await getModelByUserId('user-123', 'fast_generation', { enforce: false });

    expect(selection.modelId).toBe('gpt-4o');
    expect(selection.premiumModelId).toBe('gpt-4o');
    expect(mockCheckQuotaByUserId).toHaveBeenCalledWith('user-123', 'fast_generation', { enforce: false });
  });
});
