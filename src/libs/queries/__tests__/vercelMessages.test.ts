import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ addBreadcrumb: vi.fn(), captureException: vi.fn() }));

// Mock DB with chainable query builder
const mockReturning = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
const mockLimit = vi.fn().mockResolvedValue([]);
const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy, returning: mockReturning });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
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
  createMessage,
  getConversationMessages,
  updateMessageMetadata,
} = await import('../vercelMessages');

const mockSupabase = {} as any;

describe('vercelMessages queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([]);
    mockLimit.mockResolvedValue([]);
  });

  afterEach(() => {});

  describe('createMessage', () => {
    it('returns { data, error: null } on success', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
        tokenCount: null,
        latencyMs: null,
        createdAt: new Date(),
      };
      mockReturning.mockResolvedValueOnce([mockMessage]);

      const result = await createMessage(mockSupabase, 'conv-1', 'user', 'Hello');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.data).toEqual(mockMessage);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw with DbQueryError shape', async () => {
      mockInsert.mockImplementationOnce(() => {
        throw new Error('Insert failed');
      });

      const result = await createMessage(mockSupabase, 'conv-1', 'user', 'Hello');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error).toHaveProperty('message');
      expect(typeof result.error!.message).toBe('string');
      expect(result.error!.message).toBe('Insert failed');
    });
  });

  describe('getConversationMessages', () => {
    it('returns { data: array, error: null } on success', async () => {
      const mockMessages = [
        { id: 'msg-1', conversationId: 'conv-1', role: 'user', content: 'Hello', tokenCount: null, latencyMs: null, createdAt: new Date() },
        { id: 'msg-2', conversationId: 'conv-1', role: 'assistant', content: 'Hi!', tokenCount: 50, latencyMs: 200, createdAt: new Date() },
      ];
      mockLimit.mockResolvedValueOnce(mockMessages);

      const result = await getConversationMessages(mockSupabase, 'conv-1');

      expect(result.data).toEqual(mockMessages);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockSelect.mockImplementationOnce(() => {
        throw new Error('Query failed');
      });

      const result = await getConversationMessages(mockSupabase, 'conv-1');

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateMessageMetadata', () => {
    it('returns { data, error: null } on success', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'Response',
        tokenCount: 100,
        latencyMs: 500,
        createdAt: new Date(),
      };
      mockReturning.mockResolvedValueOnce([mockMessage]);

      const result = await updateMessageMetadata(mockSupabase, 'msg-1', { tokenCount: 100, latencyMs: 500 });

      expect(result.data).toEqual(mockMessage);
      expect(result.error).toBeNull();
    });

    it('returns { data: null, error } on DB throw', async () => {
      mockUpdate.mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      const result = await updateMessageMetadata(mockSupabase, 'msg-1', { tokenCount: 50 });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
});
