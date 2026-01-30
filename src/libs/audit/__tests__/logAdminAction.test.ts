import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditAction, LogAdminActionParams } from '../logAdminAction';

// Mock the DB module
const mockValues = vi.fn().mockResolvedValue({});
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock('@/libs/DB', () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

// Import after mocking
const { logAdminAction } = await import('../logAdminAction');

describe('logAdminAction', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const baseParams: LogAdminActionParams = {
    action: 'suspend_user',
    targetType: 'user',
    targetId: 'user-123-uuid',
    adminId: 'admin-456-uuid',
  };

  it('creates audit log entry with required fields', async () => {
    const result = await logAdminAction(baseParams);

    expect(result).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      adminId: 'admin-456-uuid',
      action: 'suspend_user',
      targetType: 'user',
      targetId: 'user-123-uuid',
      metadata: null,
    });
  });

  it('includes metadata when provided', async () => {
    const result = await logAdminAction({
      ...baseParams,
      metadata: { reason: 'Spam activity' },
    });

    expect(result).toBe(true);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { reason: 'Spam activity' },
      }),
    );
  });

  it('returns true on success', async () => {
    const result = await logAdminAction(baseParams);

    expect(result).toBe(true);
  });

  it('returns false on DB error without throwing', async () => {
    mockValues.mockRejectedValueOnce(new Error('DB connection failed'));

    const result = await logAdminAction(baseParams);

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to log admin action:',
      expect.any(Error),
    );
  });

  it('does not throw errors', async () => {
    mockValues.mockRejectedValueOnce(new Error('DB error'));

    await expect(logAdminAction(baseParams)).resolves.not.toThrow();
  });

  it.each([
    'suspend_user',
    'unsuspend_user',
    'delete_user',
    'reset_password',
  ] as AuditAction[])('supports action type: %s', async (action) => {
    const result = await logAdminAction({
      ...baseParams,
      action,
    });

    expect(result).toBe(true);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ action }),
    );
  });

  it('sets metadata to null when not provided', async () => {
    await logAdminAction(baseParams);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: null }),
    );
  });
});
