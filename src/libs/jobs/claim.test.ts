// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@/libs/Logger';
import { createAdminClient } from '@/libs/supabase/admin';

import { claimDueTasks, STALE_TASK_THRESHOLD_MS } from './claim';

vi.mock('@/libs/Env', () => ({
  Env: {
    DB_SCHEMA: 'vt_saas',
    NEXT_PUBLIC_DB_SCHEMA: 'vt_saas',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}));

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

type SupabaseMockOptions = {
  tasksData?: unknown;
  tasksError?: unknown;
  staleError?: unknown;
};

/**
 * Mocks the two-statement claim chain:
 *   1. claim:       .update({status:'claimed'}).eq('status','scheduled').lte('scheduled_at', now).select('id')
 *   2. stale-reset: .update({status:'scheduled'}).in('status',[...]).lte('updated_at', threshold)
 */
function buildSupabaseMock(options: SupabaseMockOptions = {}) {
  const selectAfterUpdateMock = vi.fn().mockReturnValue({
    data: options.tasksData ?? [],
    error: options.tasksError ?? null,
  });
  const lteOnClaimMock = vi
    .fn()
    .mockReturnValue({ select: selectAfterUpdateMock });
  const eqOnClaimMock = vi.fn().mockReturnValue({ lte: lteOnClaimMock });

  const lteOnStaleMock = vi
    .fn()
    .mockResolvedValue({ data: null, error: options.staleError ?? null });
  const inOnStaleMock = vi.fn().mockReturnValue({ lte: lteOnStaleMock });

  let updateCallCount = 0;
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'scheduled_tasks') {
      return {
        update: vi.fn().mockImplementation(() => {
          updateCallCount += 1;
          // First update = atomic claim; second = stale-reset.
          return updateCallCount === 1
            ? { eq: eqOnClaimMock }
            : { in: inOnStaleMock };
        }),
      };
    }
    return { update: vi.fn() };
  });

  return {
    from: fromMock,
    _eqOnClaimMock: eqOnClaimMock,
    _lteOnClaimMock: lteOnClaimMock,
    _selectAfterUpdateMock: selectAfterUpdateMock,
    _inOnStaleMock: inOnStaleMock,
    _lteOnStaleMock: lteOnStaleMock,
  };
}

describe('claimDueTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('claims only tasks with status=scheduled and scheduled_at <= now()', async () => {
    const mockSupabase = buildSupabaseMock({ tasksData: [] });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const before = new Date().toISOString();
    await claimDueTasks();
    const after = new Date().toISOString();

    expect(mockSupabase.from).toHaveBeenCalledWith('scheduled_tasks');
    expect(mockSupabase._eqOnClaimMock).toHaveBeenCalledWith(
      'status',
      'scheduled',
    );
    expect(mockSupabase._selectAfterUpdateMock).toHaveBeenCalledWith('id');
    expect(mockSupabase._lteOnClaimMock).toHaveBeenCalledOnce();

    const [lteField, lteValue] = mockSupabase._lteOnClaimMock.mock.calls[0]!;

    expect(lteField).toBe('scheduled_at');
    expect(lteValue >= before).toBe(true);
    expect(lteValue <= after).toBe(true);
  });

  it('returns an empty array when no tasks are due', async () => {
    const mockSupabase = buildSupabaseMock({ tasksData: [] });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const result = await claimDueTasks();

    expect(result).toEqual([]);
  });

  it('returns the IDs claimed by the single atomic UPDATE', async () => {
    const claimed = [{ id: 't-1' }, { id: 't-2' }, { id: 't-3' }];
    const mockSupabase = buildSupabaseMock({ tasksData: claimed });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const result = await claimDueTasks();

    expect(result).toEqual(['t-1', 't-2', 't-3']);
  });

  it('runs a stale-reset UPDATE for in-flight tasks older than the 30-minute threshold', async () => {
    const mockSupabase = buildSupabaseMock({ tasksData: [] });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const beforeMs = Date.now() - STALE_TASK_THRESHOLD_MS;
    await claimDueTasks();
    const afterMs = Date.now() - STALE_TASK_THRESHOLD_MS;

    // Stale-reset targets both in-flight states.
    expect(mockSupabase._inOnStaleMock).toHaveBeenCalledWith('status', [
      'claimed',
      'running',
    ]);
    expect(mockSupabase._lteOnStaleMock).toHaveBeenCalledOnce();

    const [staleField, staleValue]
      = mockSupabase._lteOnStaleMock.mock.calls[0]!;

    expect(staleField).toBe('updated_at');
    expect(STALE_TASK_THRESHOLD_MS).toBe(30 * 60 * 1000);
    expect(Date.parse(staleValue as string)).toBeGreaterThanOrEqual(beforeMs);
    expect(Date.parse(staleValue as string)).toBeLessThanOrEqual(afterMs);
  });

  it('throws when the claim UPDATE returns an error', async () => {
    const mockSupabase = buildSupabaseMock({
      tasksData: null,
      tasksError: { message: 'connection lost' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    await expect(claimDueTasks()).rejects.toThrow(/connection lost/);
  });

  it('logs but does not throw when the stale-reset UPDATE errors', async () => {
    const mockSupabase = buildSupabaseMock({
      tasksData: [{ id: 't-1' }],
      staleError: { message: 'stale-reset write failed' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    // The atomic claim already succeeded, so a failed best-effort stale-reset
    // must not fail the tick — it returns the claimed IDs and logs the error.
    const result = await claimDueTasks();

    expect(result).toEqual(['t-1']);
    expect(logger.error).toHaveBeenCalledWith(
      { error: 'stale-reset write failed' },
      expect.stringContaining('stale-reset failed'),
    );
  });
});
