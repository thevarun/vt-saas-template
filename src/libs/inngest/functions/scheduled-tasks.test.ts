// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdminClient } from '@/libs/supabase/admin';

import { cronHandler, processSingleTask, singleTaskHandler } from './scheduled-tasks';

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

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

type SupabaseMockOptions = {
  taskData?: unknown;
  taskError?: unknown;
};

// Mocks both the cron claim chain and the single-task handler's load + update chains.
function buildSupabaseMock(options: SupabaseMockOptions = {}) {
  // Claim chain (cron): .update().eq('status','scheduled').lte('scheduled_at').select('id')
  const claimSelectMock = vi.fn().mockReturnValue({
    data: Array.isArray(options.taskData) ? options.taskData : [],
    error: null,
  });
  const claimLteMock = vi.fn().mockReturnValue({ select: claimSelectMock });
  const staleLteMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const staleInMock = vi.fn().mockReturnValue({ lte: staleLteMock });

  // Single-task load chain: .select('id, status').eq('id', id).single()
  const singleMock = vi.fn().mockResolvedValue({
    data: options.taskData ?? null,
    error: options.taskError ?? null,
  });
  const selectEqMock = vi.fn().mockReturnValue({ single: singleMock });

  // Status update chain keyed by id: .update({...}).eq('id', id) — resolves directly.
  const updateEqMock = vi.fn().mockResolvedValue({ data: null, error: null });

  // Polymorphic .eq after .update: 'status' -> cron claim chain; 'id' -> resolved promise.
  const updateEqRouter = vi.fn().mockImplementation((field: string, value: unknown) => {
    if (field === 'status') {
      return { lte: claimLteMock };
    }
    return updateEqMock(field, value);
  });

  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === 'scheduled_tasks') {
      return {
        select: vi.fn().mockReturnValue({ eq: selectEqMock }),
        update: vi.fn().mockReturnValue({ eq: updateEqRouter, in: staleInMock }),
      };
    }
    return { select: vi.fn(), update: vi.fn() };
  });

  return {
    from: fromMock,
    _updateEqMock: updateEqMock,
    _singleMock: singleMock,
  };
}

describe('cronHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { dispatched: 0 } and sends no event when no tasks are due', async () => {
    const mockSupabase = buildSupabaseMock({ taskData: [] });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const fakeStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      sendEvent: vi.fn(async () => ({ ids: [] })),
    };

    const result = await cronHandler({ step: fakeStep as never, logger: mockLogger });

    expect(result).toEqual({ dispatched: 0 });
    expect(fakeStep.run).toHaveBeenCalledExactlyOnceWith(
      'claim-due-tasks',
      expect.any(Function),
    );
    expect(fakeStep.sendEvent).not.toHaveBeenCalled();
  });

  it('fans out one vt-saas/task.process event per claimed task', async () => {
    const sentEvents: Array<{ name: string; data: { taskId: string } }> = [];
    const fakeStep = {
      run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
      sendEvent: vi.fn(async (_name: string, events: unknown[]) => {
        for (const e of events) {
          sentEvents.push(e as { name: string; data: { taskId: string } });
        }
        return { ids: [] };
      }),
    };

    const mockSupabase = buildSupabaseMock({
      taskData: [{ id: 'task-a' }, { id: 'task-b' }, { id: 'task-c' }],
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const result = await cronHandler({ step: fakeStep as never, logger: mockLogger });

    expect(result).toEqual({ dispatched: 3 });
    expect(fakeStep.sendEvent).toHaveBeenCalledOnce();
    expect(sentEvents).toEqual([
      { name: 'vt-saas/task.process', data: { taskId: 'task-a' } },
      { name: 'vt-saas/task.process', data: { taskId: 'task-b' } },
      { name: 'vt-saas/task.process', data: { taskId: 'task-c' } },
    ]);
  });
});

describe('singleTaskHandler — at-most-once guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the task inline (no step.run) and flips status claimed -> running -> done', async () => {
    const mockSupabase = buildSupabaseMock({
      taskData: { id: 'task-1', status: 'claimed' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    await singleTaskHandler({ event: { data: { taskId: 'task-1' } }, logger: mockLogger });

    // Two status updates: -> running, then -> done.
    expect(mockSupabase._updateEqMock).toHaveBeenCalledTimes(2);
    expect(mockSupabase._updateEqMock).toHaveBeenCalledWith('id', 'task-1');
  });

  it('skips (done-skip layer) when the task is already done', async () => {
    const mockSupabase = buildSupabaseMock({
      taskData: { id: 'task-done', status: 'done' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    await singleTaskHandler({ event: { data: { taskId: 'task-done' } }, logger: mockLogger });

    expect(mockSupabase._updateEqMock).not.toHaveBeenCalled();
  });

  it('skips (status guard layer) when the task is not in claimed state', async () => {
    const mockSupabase = buildSupabaseMock({
      taskData: { id: 'task-running', status: 'running' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    await singleTaskHandler({ event: { data: { taskId: 'task-running' } }, logger: mockLogger });

    expect(mockSupabase._updateEqMock).not.toHaveBeenCalled();
  });

  it('throws when the task cannot be loaded (so Inngest retries)', async () => {
    const mockSupabase = buildSupabaseMock({
      taskData: null,
      taskError: { message: 'not found' },
    });
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    await expect(
      singleTaskHandler({ event: { data: { taskId: 'missing' } }, logger: mockLogger }),
    ).rejects.toThrow(/Failed to load task/);
  });
});

describe('processSingleTask — onFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flips status -> failed, records last_error, and captures to Sentry', async () => {
    const Sentry = await import('@sentry/nextjs');
    const mockSupabase = buildSupabaseMock({});
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const onFailure = (
      processSingleTask as unknown as {
        opts: { onFailure: (args: unknown) => Promise<void> };
      }
    ).opts.onFailure;

    await onFailure({
      event: { data: { event: { data: { taskId: 'task-fail' } } } },
      error: new Error('boom'),
      logger: mockLogger,
    });

    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalledOnce();
    expect(mockSupabase._updateEqMock).toHaveBeenCalledWith('id', 'task-fail');
  });
});
