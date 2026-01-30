import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DB with chainable query builder
const mockOffset = vi.fn().mockResolvedValue([]);
const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

// Mock Supabase admin client
const mockGetUserById = vi.fn().mockResolvedValue({
  data: { user: { email: 'admin@example.com' } },
});

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  }),
}));

const { getAuditLogs, getAuditLogCount } = await import('../auditLog');

describe('audit log queries', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset chain defaults
    mockOffset.mockResolvedValue([]);
    mockLimit.mockReturnValue({ offset: mockOffset });
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getAuditLogs', () => {
    it('returns empty array when no logs exist', async () => {
      const logs = await getAuditLogs();

      expect(logs).toEqual([]);
    });

    it('returns enriched logs with admin email', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          adminId: 'admin-1',
          action: 'suspend_user',
          targetType: 'user',
          targetId: 'user-1',
          metadata: { reason: 'Spam' },
          createdAt: new Date('2026-01-29T12:00:00Z'),
        },
      ];
      mockOffset.mockResolvedValueOnce(mockLogs);

      const logs = await getAuditLogs();

      expect(logs).toHaveLength(1);
      expect(logs![0]!.adminEmail).toBe('admin@example.com');
      expect(logs![0]!.action).toBe('suspend_user');
    });

    it('applies default limit of 50 and offset of 0', async () => {
      await getAuditLogs();

      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('applies custom limit and offset', async () => {
      await getAuditLogs({ limit: 10, offset: 20 });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(20);
    });

    it('calls select and from', async () => {
      await getAuditLogs();

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });

    it('applies action filter', async () => {
      await getAuditLogs({ action: 'suspend_user' });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('applies adminId filter', async () => {
      await getAuditLogs({ adminId: 'admin-123' });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('applies date range filter', async () => {
      await getAuditLogs({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('returns null on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const logs = await getAuditLogs();

      expect(logs).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch audit logs:',
        expect.any(Error),
      );
    });

    it('handles admin email lookup failure gracefully', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          adminId: 'admin-unknown',
          action: 'suspend_user',
          targetType: 'user',
          targetId: 'user-1',
          metadata: null,
          createdAt: new Date('2026-01-29T12:00:00Z'),
        },
      ];
      mockOffset.mockResolvedValueOnce(mockLogs);
      mockGetUserById.mockRejectedValueOnce(new Error('User not found'));

      const logs = await getAuditLogs();

      expect(logs).toHaveLength(1);
      expect(logs![0]!.adminEmail).toBeUndefined();
    });
  });

  describe('getAuditLogCount', () => {
    it('returns count of audit logs', async () => {
      // For count query, the chain is: select -> from -> where -> resolved value
      const countWhere = vi.fn().mockResolvedValue([{ count: 42 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getAuditLogCount();

      expect(result).toBe(42);
    });

    it('returns 0 when no logs exist', async () => {
      const countWhere = vi.fn().mockResolvedValue([{ count: 0 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getAuditLogCount();

      expect(result).toBe(0);
    });

    it('returns 0 on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = await getAuditLogCount();

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to count audit logs:',
        expect.any(Error),
      );
    });

    it('applies filters for count', async () => {
      const countWhere = vi.fn().mockResolvedValue([{ count: 5 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getAuditLogCount({ action: 'suspend_user' });

      expect(result).toBe(5);
      expect(countWhere).toHaveBeenCalled();
    });
  });
});
