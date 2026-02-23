import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

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

const { getFeedbackList, getFeedbackCount } = await import('../feedback');
const { logger: mockLogger } = await import('@/libs/Logger');

describe('feedback queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain defaults
    mockOffset.mockResolvedValue([]);
    mockLimit.mockReturnValue({ offset: mockOffset });
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  afterEach(() => {
  });

  describe('getFeedbackList', () => {
    it('returns feedback without filters', async () => {
      const mockFeedback = [
        {
          id: 'fb-1',
          type: 'bug',
          message: 'Something is broken',
          email: 'user@example.com',
          status: 'pending',
          userId: 'user-1',
          createdAt: new Date('2026-01-29T12:00:00Z'),
          reviewedAt: null,
        },
      ];
      mockOffset.mockResolvedValueOnce(mockFeedback);

      const result = await getFeedbackList();

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('bug');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });

    it('filters by type', async () => {
      await getFeedbackList({ type: 'bug' });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('filters by status', async () => {
      await getFeedbackList({ status: 'pending' });

      expect(mockWhere).toHaveBeenCalled();
    });

    it('applies default limit of 20 and offset of 0', async () => {
      await getFeedbackList();

      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('applies custom limit and offset', async () => {
      await getFeedbackList({ limit: 10, offset: 40 });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(40);
    });

    it('returns null on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = await getFeedbackList();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getFeedbackCount', () => {
    it('returns count of feedback', async () => {
      const countWhere = vi.fn().mockResolvedValue([{ count: 15 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getFeedbackCount();

      expect(result).toBe(15);
    });

    it('returns 0 when no feedback exists', async () => {
      const countWhere = vi.fn().mockResolvedValue([{ count: 0 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getFeedbackCount();

      expect(result).toBe(0);
    });

    it('returns 0 on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = await getFeedbackCount();

      expect(result).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('applies filters for count', async () => {
      const countWhere = vi.fn().mockResolvedValue([{ count: 3 }]);
      const countFrom = vi.fn().mockReturnValue({ where: countWhere });
      mockSelect.mockReturnValueOnce({ from: countFrom });

      const result = await getFeedbackCount({ type: 'feature' });

      expect(result).toBe(3);
      expect(countWhere).toHaveBeenCalled();
    });
  });
});
