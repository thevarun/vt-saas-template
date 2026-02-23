import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));

// Mock DB with chainable query builder
const mockReturning = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockLimit = vi.fn().mockResolvedValue([]);
const mockOrderBy = vi.fn().mockResolvedValue([]);
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy, returning: mockReturning });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
const mockDelete = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const {
  getThreadsByUser,
  getThreadById,
  getThreadByConversationId,
  createThread,
  updateThread,
  deleteThread,
} = await import('../threads');

describe('threads queries (Drizzle)', () => {
  const now = new Date();
  const mockThread = {
    id: 'thread-1',
    userId: 'user-1',
    conversationId: 'conv-1',
    title: 'Test Thread',
    lastMessagePreview: 'Hello',
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([]);
    mockLimit.mockResolvedValue([]);
    mockOrderBy.mockResolvedValue([]);
  });

  describe('getThreadsByUser', () => {
    it('returns { data: array, error: null } on success', async () => {
      mockOrderBy.mockResolvedValueOnce([mockThread]);

      const result = await getThreadsByUser('user-1');

      expect(result.data).toEqual([mockThread]);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB connection failed');
      });

      const result = await getThreadsByUser('user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('DB connection failed');
    });
  });

  describe('getThreadById', () => {
    it('returns thread with userId ownership filter', async () => {
      mockLimit.mockResolvedValueOnce([mockThread]);

      const result = await getThreadById('thread-1', 'user-1');

      expect(result.data).toEqual(mockThread);
      expect(result.error).toBeNull();
    });

    it('returns null when not found', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getThreadById('nonexistent', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('returns error on DB throw', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB failure');
      });

      const result = await getThreadById('thread-1', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('getThreadByConversationId', () => {
    it('returns thread with conversationId and userId filter', async () => {
      mockLimit.mockResolvedValueOnce([mockThread]);

      const result = await getThreadByConversationId('conv-1', 'user-1');

      expect(result.data).toEqual(mockThread);
      expect(result.error).toBeNull();
    });

    it('returns null when not found', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getThreadByConversationId('nonexistent', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('returns error on DB throw', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB failure');
      });

      const result = await getThreadByConversationId('conv-1', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('createThread', () => {
    it('returns { data, error: null } on success', async () => {
      mockReturning.mockResolvedValueOnce([mockThread]);

      const result = await createThread('user-1', {
        conversationId: 'conv-1',
        title: 'Test Thread',
        lastMessagePreview: 'Hello',
      });

      expect(result.data).toEqual(mockThread);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('Insert failed');
      });

      const result = await createThread('user-1', {
        conversationId: 'conv-1',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error!.message).toBe('Insert failed');
    });
  });

  describe('updateThread', () => {
    it('returns { data, error: null } on success with userId filter', async () => {
      const updatedThread = { ...mockThread, title: 'Updated' };
      mockReturning.mockResolvedValueOnce([updatedThread]);

      const result = await updateThread('thread-1', { title: 'Updated' }, 'user-1');

      expect(result.data).toEqual(updatedThread);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const result = await updateThread('thread-1', { title: 'Fail' }, 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('deleteThread', () => {
    it('returns { data, error: null } on success with userId filter', async () => {
      mockReturning.mockResolvedValueOnce([mockThread]);

      const result = await deleteThread('thread-1', 'user-1');

      expect(result.data).toEqual(mockThread);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockDelete.mockImplementationOnce(() => {
        throw new Error('Delete failed');
      });

      const result = await deleteThread('thread-1', 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('DbQueryError pattern', () => {
    it('all functions return { data, error } with DbQueryError shape', async () => {
      mockSelect.mockImplementation(() => {
        throw new Error('Test error');
      });

      const results = await Promise.all([
        getThreadsByUser('user-1'),
        getThreadById('id', 'user-1'),
        getThreadByConversationId('conv', 'user-1'),
      ]);

      for (const result of results) {
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error).toHaveProperty('message');
        expect(typeof result.error!.message).toBe('string');
      }
    });
  });
});
