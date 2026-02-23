import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));

// Mock DB with chainable query builder
const mockReturning = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockLimit = vi.fn().mockResolvedValue([]);
const mockOffset = vi.fn().mockResolvedValue([]);
const mockOrderBy = vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ offset: mockOffset }) });
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
  getConversationById,
  createConversation,
  updateConversation,
  listUserConversations,
  deleteConversation,
} = await import('../vercelConversations');

const mockSupabase = {} as any;

describe('vercelConversations queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset chain defaults
    mockReturning.mockResolvedValue([]);
    mockLimit.mockResolvedValue([]);
    mockOffset.mockResolvedValue([]);
  });

  afterEach(() => {});

  describe('getConversationById', () => {
    it('returns { data, error: null } on success', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Test',
        lastMessagePreview: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockLimit.mockResolvedValueOnce([mockConversation]);

      const result = await getConversationById(mockSupabase, 'conv-1', 'user-1');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.data).toEqual(mockConversation);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw with DbQueryError shape', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('DB connection failed');
      });

      const result = await getConversationById(mockSupabase, 'conv-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      // Verify error conforms to DbQueryError shape
      expect(result.error).toHaveProperty('message');
      expect(typeof result.error!.message).toBe('string');
      expect(result.error!.message).toBe('DB connection failed');
    });

    it('wraps non-Error throws into DbQueryError', async () => {
      mockSelect.mockImplementationOnce(() => {
        // eslint-disable-next-line no-throw-literal
        throw { code: '23505', detail: 'duplicate key' };
      });

      const result = await getConversationById(mockSupabase, 'conv-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(typeof result.error!.message).toBe('string');
      expect(result.error!.code).toBe('23505');
      expect(result.error!.detail).toBe('duplicate key');
    });

    it('returns { data: null, error: null } when not found', async () => {
      mockLimit.mockResolvedValueOnce([]);

      const result = await getConversationById(mockSupabase, 'nonexistent');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('createConversation', () => {
    it('returns { data, error: null } on success', async () => {
      const mockConversation = {
        id: 'conv-new',
        userId: 'user-1',
        title: 'New Chat',
        lastMessagePreview: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValueOnce([mockConversation]);

      const result = await createConversation(mockSupabase, 'user-1', 'New Chat');

      expect(result.data).toEqual(mockConversation);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('Insert failed');
      });

      const result = await createConversation(mockSupabase, 'user-1', 'Test');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('listUserConversations', () => {
    it('returns { data: array, error: null } on success', async () => {
      const mockConversations = [
        { id: 'conv-1', userId: 'user-1', title: 'Chat 1', lastMessagePreview: null, archived: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockOffset.mockResolvedValueOnce(mockConversations);

      const result = await listUserConversations(mockSupabase, 'user-1', false, 10, 0);

      expect(result.data).toEqual(mockConversations);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('Query failed');
      });

      const result = await listUserConversations(mockSupabase, 'user-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateConversation', () => {
    it('returns { data, error: null } on success', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Updated Title',
        lastMessagePreview: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValueOnce([mockConversation]);

      const result = await updateConversation(mockSupabase, 'conv-1', { title: 'Updated Title' });

      expect(result.data).toEqual(mockConversation);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const result = await updateConversation(mockSupabase, 'conv-1', { title: 'Fail' });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('deleteConversation', () => {
    it('returns { data, error: null } on success', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Deleted',
        lastMessagePreview: null,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValueOnce([mockConversation]);

      const result = await deleteConversation(mockSupabase, 'conv-1');

      expect(result.data).toEqual(mockConversation);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockDelete.mockImplementationOnce(() => {
        throw new Error('Delete failed');
      });

      const result = await deleteConversation(mockSupabase, 'conv-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
