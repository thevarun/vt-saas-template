import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/libs/api/errors', () => ({
  invalidRequestError: vi.fn((msg: string) =>
    new Response(JSON.stringify({ error: msg, code: 'INVALID_REQUEST' }), { status: 400 }),
  ),
}));

const mockGetConversationById = vi.fn();
vi.mock('@/libs/queries/vercelConversations', () => ({
  getConversationById: (...args: unknown[]) => mockGetConversationById(...args),
  updateConversation: vi.fn(),
}));
vi.mock('@/libs/queries/vercelMessages', () => ({
  createMessage: vi.fn().mockResolvedValue({ data: null, error: null }),
}));
vi.mock('@/libs/mem0/queue', () => ({
  queueMemoryExtraction: vi.fn().mockResolvedValue(undefined),
}));

const mockTransaction = vi.fn();
vi.mock('@/libs/DB', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const {
  extractUserMessage,
  normalizeMessagesForAI,
  ensureConversation,
} = await import('../helpers');

// ─── extractUserMessage ──────────────────────────────────────────────────────

describe('extractUserMessage', () => {
  it('returns message from simple { message: "hello" } format', () => {
    const result = extractUserMessage({ message: 'hello' });

    expect(result).toBe('hello');
  });

  it('returns text from AssistantChatTransport format with parts', () => {
    const result = extractUserMessage({
      messages: [
        { role: 'user', parts: [{ type: 'text', text: 'hello from parts' }] },
      ],
    });

    expect(result).toBe('hello from parts');
  });

  it('returns content from messages array without parts', () => {
    const result = extractUserMessage({
      messages: [
        { role: 'user', content: 'hello from content' },
      ],
    });

    expect(result).toBe('hello from content');
  });

  it('returns empty string when body has no message or messages', () => {
    const result = extractUserMessage({});

    expect(result).toBe('');
  });

  it('returns empty string when messages array has no user role', () => {
    const result = extractUserMessage({
      messages: [
        { role: 'assistant', content: 'only assistant message' },
      ],
    });

    expect(result).toBe('');
  });

  it('returns last user message from multiple messages', () => {
    const result = extractUserMessage({
      messages: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'second' },
      ],
    });

    expect(result).toBe('second');
  });

  it('prefers parts over content when both present', () => {
    const result = extractUserMessage({
      messages: [
        { role: 'user', content: 'content field', parts: [{ type: 'text', text: 'parts field' }] },
      ],
    });

    expect(result).toBe('parts field');
  });
});

// ─── normalizeMessagesForAI ──────────────────────────────────────────────────

describe('normalizeMessagesForAI', () => {
  it('filters out system messages', () => {
    const result = normalizeMessagesForAI({
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ],
    }, 'fallback');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: 'user', content: 'hello' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'hi' });
  });

  it('uses fallback message when no messages array', () => {
    const result = normalizeMessagesForAI({}, 'fallback message');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ role: 'user', content: 'fallback message' });
  });

  it('uses fallback message when messages array is empty', () => {
    const result = normalizeMessagesForAI({ messages: [] }, 'fallback');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ role: 'user', content: 'fallback' });
  });

  it('extracts text from parts for messages with parts', () => {
    const result = normalizeMessagesForAI({
      messages: [
        { role: 'user', parts: [{ type: 'text', text: 'part1' }, { type: 'text', text: 'part2' }] },
      ],
    }, 'fallback');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ role: 'user', content: 'part1part2' });
  });

  it('uses content field when no parts present', () => {
    const result = normalizeMessagesForAI({
      messages: [
        { role: 'user', content: 'hello' },
      ],
    }, 'fallback');

    expect(result[0]).toEqual({ role: 'user', content: 'hello' });
  });
});

// ─── ensureConversation ──────────────────────────────────────────────────────

describe('ensureConversation', () => {
  it('returns ok: true, isNew: false for valid existing conversationId', async () => {
    mockGetConversationById.mockResolvedValue({
      data: { id: 'conv-1', userId: 'user-1' },
      error: null,
    });

    const result = await ensureConversation('conv-1', 'user-1', 'hello');

    expect(result).toEqual({ ok: true, conversationId: 'conv-1', isNew: false });
  });

  it('returns ok: false for conversationId not found', async () => {
    mockGetConversationById.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await ensureConversation('conv-missing', 'user-1', 'hello');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Response);
      expect(result.error.status).toBe(400);
    }
  });

  it('creates conversation via transaction when no conversationId provided', async () => {
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const txMock = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn()
              .mockResolvedValueOnce([{ id: 'new-conv-id' }])
              .mockResolvedValueOnce([{ id: 'msg-1' }]),
          }),
        }),
      };
      return callback(txMock);
    });

    const result = await ensureConversation(undefined, 'user-1', 'hello');

    expect(result).toEqual({ ok: true, conversationId: 'new-conv-id', isNew: true });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('returns ok: false when transaction fails', async () => {
    mockTransaction.mockRejectedValue(new Error('Transaction failed'));

    const result = await ensureConversation(undefined, 'user-1', 'hello');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBeInstanceOf(Response);
      expect(result.error.status).toBe(500);
    }
  });
});
