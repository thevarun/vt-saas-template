import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));

// Mock DB with chainable query builder
const mockReturning = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockLimit = vi.fn().mockResolvedValue([]);
const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

const {
  createMemoryJob,
  getPendingJobs,
  getJobById,
  updateJobStatus,
} = await import('../memoryJobs');

describe('memoryJobs queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([]);
    mockLimit.mockResolvedValue([]);
  });

  afterEach(() => {});

  describe('createMemoryJob', () => {
    it('returns { data, error: null } on success', async () => {
      const mockJob = {
        id: 'job-1',
        conversationId: 'conv-1',
        status: 'pending',
        errorMessage: null,
        createdAt: new Date(),
        completedAt: null,
      };
      mockReturning.mockResolvedValueOnce([mockJob]);

      const result = await createMemoryJob('conv-1');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.data).toEqual(mockJob);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw with DbQueryError shape', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('Insert failed');
      });

      const result = await createMemoryJob('conv-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error).toHaveProperty('message');
      expect(typeof result.error!.message).toBe('string');
    });
  });

  describe('getPendingJobs', () => {
    it('returns array of jobs on success', async () => {
      const mockJobs = [
        { id: 'job-1', conversationId: 'conv-1', status: 'pending', errorMessage: null, createdAt: new Date(), completedAt: null },
      ];
      mockLimit.mockResolvedValueOnce(mockJobs);

      const result = await getPendingJobs();

      expect(result).toEqual(mockJobs);
    });

    it('returns empty array on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('Query failed');
      });

      const result = await getPendingJobs();

      expect(result).toEqual([]);
    });
  });

  describe('getJobById', () => {
    it('returns job on success', async () => {
      const mockJob = {
        id: 'job-1',
        conversationId: 'conv-1',
        status: 'processing',
        errorMessage: null,
        createdAt: new Date(),
        completedAt: null,
      };
      mockLimit.mockResolvedValueOnce([mockJob]);

      const result = await getJobById('job-1');

      expect(result).toEqual(mockJob);
    });

    it('returns null when not found', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getJobById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = await getJobById('job-1');

      expect(result).toBeNull();
    });
  });

  describe('updateJobStatus', () => {
    it('returns { success: true, error: null } on success', async () => {
      const result = await updateJobStatus('job-1', 'completed');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('returns { success: false, error } on DB throw with DbQueryError shape', async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const result = await updateJobStatus('job-1', 'failed', 'Something went wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toHaveProperty('message');
      expect(typeof result.error!.message).toBe('string');
    });

    it('accepts all valid MemoryJobStatus values', async () => {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'] as const;

      for (const status of validStatuses) {
        vi.clearAllMocks();
        mockUpdate.mockReturnValue({ set: mockSet });
        const result = await updateJobStatus('job-1', status);

        expect(result.success).toBe(true);
      }
    });
  });
});
