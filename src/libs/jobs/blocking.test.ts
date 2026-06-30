import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn((_table: unknown) => ({ set: mockSet }));

vi.mock('@/libs/DB', () => ({
  db: { update: (table: unknown) => mockUpdate(table) },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/models/Schema', () => ({
  scheduledTasks: { id: 'id', userId: 'user_id', status: 'status' },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((...args: unknown[]) => args),
}));

const { scheduledTasks } = await import('@/models/Schema');
const { blockScheduledTasksForUser } = await import('./blocking');

describe('blockScheduledTasksForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks scheduled tasks as blocked with the given reason', async () => {
    mockReturning.mockResolvedValueOnce([
      { id: 'task-1' },
      { id: 'task-2' },
    ]);

    const count = await blockScheduledTasksForUser('user-123', 'trial_expired');

    expect(count).toBe(2);
    expect(mockUpdate).toHaveBeenCalledWith(scheduledTasks);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'blocked',
        blockedReason: 'trial_expired',
      }),
    );
  });

  it('returns 0 when there are no scheduled tasks', async () => {
    mockReturning.mockResolvedValueOnce([]);

    const count = await blockScheduledTasksForUser('user-123', 'subscription_cancelled');

    expect(count).toBe(0);
  });
});
