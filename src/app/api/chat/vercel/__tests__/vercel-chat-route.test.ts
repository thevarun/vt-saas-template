import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ALL dependencies BEFORE importing the route

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
  logAuthError: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
}));

const mockIsConfigured = vi.fn().mockReturnValue(true);
vi.mock('@/libs/vercel-ai/config', () => ({
  isConfigured: (...args: unknown[]) => mockIsConfigured(...args),
}));

const mockStreamText = vi.fn().mockReturnValue({
  toUIMessageStreamResponse: () => new Response('streamed'),
  text: Promise.resolve('AI response'),
  usage: Promise.resolve({ totalTokens: 10 }),
});
vi.mock('ai', () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

const mockCreateAIProvider = vi.fn().mockResolvedValue('mock-model');
vi.mock('@/libs/vercel-ai/client', () => ({
  createAIProvider: (...args: unknown[]) => mockCreateAIProvider(...args),
}));

const mockGetRelevantMemories = vi.fn().mockResolvedValue([]);
const mockFormatMemoriesForPrompt = vi.fn().mockReturnValue('');
vi.mock('@/libs/mem0/retrieval', () => ({
  getRelevantMemories: (...args: unknown[]) => mockGetRelevantMemories(...args),
  formatMemoriesForPrompt: (...args: unknown[]) => mockFormatMemoriesForPrompt(...args),
}));

vi.mock('@/libs/mem0/queue', () => ({
  queueMemoryExtraction: vi.fn().mockResolvedValue(undefined),
}));

// Mock conversation queries
const mockCreateConversation = vi.fn();
const mockGetConversationById = vi.fn();
const mockUpdateConversation = vi.fn();
vi.mock('@/libs/queries/vercelConversations', () => ({
  createConversation: (...args: unknown[]) => mockCreateConversation(...args),
  getConversationById: (...args: unknown[]) => mockGetConversationById(...args),
  updateConversation: (...args: unknown[]) => mockUpdateConversation(...args),
}));

const mockCreateMessage = vi.fn();
vi.mock('@/libs/queries/vercelMessages', () => ({
  createMessage: (...args: unknown[]) => mockCreateMessage(...args),
}));

// Track transaction calls
const mockTransaction = vi.fn();

vi.mock('@/libs/DB', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const { POST } = await import('../route');
const { createClient } = await import('@/libs/supabase/server');
const { cookies } = await import('next/headers');

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/chat/vercel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAuth(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(cookies).mockResolvedValue({} as any);
  vi.mocked(createClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  } as any);
}

function setupNewConversationTransaction() {
  mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
    const txMock = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn()
            .mockResolvedValueOnce([{ id: 'conv-new', userId: 'user-1', title: 'hello' }])
            .mockResolvedValueOnce([{ id: 'msg-1' }]),
        }),
      }),
    };
    return callback(txMock);
  });
}

describe('POST /api/chat/vercel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateConversation.mockResolvedValue({ data: null, error: null });
    mockIsConfigured.mockReturnValue(true);
    mockCreateAIProvider.mockResolvedValue('mock-model');
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response('streamed'),
      text: Promise.resolve('AI response'),
      usage: Promise.resolve({ totalTokens: 10 }),
    });
    mockGetRelevantMemories.mockResolvedValue([]);
    mockFormatMemoriesForPrompt.mockReturnValue('');
    mockCreateMessage.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
  });

  it('returns 401 without authentication', async () => {
    mockAuth(null);
    const response = await POST(createRequest({ message: 'hello' }));

    expect(response.status).toBe(401);
  });

  // ─── Zod Validation Tests ──────────────────────────────────────────────────

  describe('Zod validation', () => {
    it('returns 400 for empty body (missing message and messages)', async () => {
      mockAuth();
      const response = await POST(createRequest({}));

      expect(response.status).toBe(400);
    });

    it('returns 400 when message is empty string', async () => {
      mockAuth();
      const response = await POST(createRequest({ message: '' }));

      expect(response.status).toBe(400);

      const body = await response.json();

      expect(body.error).toContain('Message is required');
    });

    it('returns 400 when message exceeds 10,000 characters', async () => {
      mockAuth();
      const longMessage = 'x'.repeat(10001);
      const response = await POST(createRequest({ message: longMessage }));

      expect(response.status).toBe(400);

      const body = await response.json();

      expect(body.error).toContain('maximum length');
    });

    it('returns 400 for invalid conversationId (non-UUID)', async () => {
      mockAuth();
      const response = await POST(createRequest({
        message: 'hello',
        conversationId: 'not-a-uuid',
      }));

      expect(response.status).toBe(400);
    });
  });

  // ─── Message Parsing Tests ─────────────────────────────────────────────────

  describe('message parsing', () => {
    it('extracts last user message from AssistantChatTransport format with parts', async () => {
      mockAuth();
      setupNewConversationTransaction();

      const response = await POST(createRequest({
        messages: [
          { role: 'user', parts: [{ type: 'text', text: 'first message' }] },
          { role: 'assistant', content: 'response' },
          { role: 'user', parts: [{ type: 'text', text: 'second message' }] },
        ],
      }));

      expect(response.status).toBe(200);
    });

    it('extracts message from simple { message } format', async () => {
      mockAuth();
      setupNewConversationTransaction();

      const response = await POST(createRequest({ message: 'hello world' }));

      expect(response.status).toBe(200);
    });

    it('extracts content from messages array without parts', async () => {
      mockAuth();
      setupNewConversationTransaction();

      const response = await POST(createRequest({
        messages: [
          { role: 'user', content: 'hello from content field' },
        ],
      }));

      expect(response.status).toBe(200);
    });
  });

  // ─── AI Config Tests ───────────────────────────────────────────────────────

  describe('AI configuration', () => {
    it('returns 400 when isConfigured() returns false', async () => {
      mockAuth();
      mockIsConfigured.mockReturnValue(false);

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(400);

      const body = await response.json();

      expect(body.error).toContain('not configured');
    });

    it('returns 500 when createAIProvider() throws API key error', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockCreateAIProvider.mockRejectedValue(new Error('Invalid API key'));

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(500);
    });
  });

  // ─── Error Categorization Tests ────────────────────────────────────────────

  describe('error categorization', () => {
    it('returns 408 for timeout errors', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockCreateAIProvider.mockRejectedValue(new Error('Request timeout exceeded'));

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(408);
    });

    it('returns 429 for rate limit errors', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockCreateAIProvider.mockRejectedValue(new Error('rate limit exceeded'));

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(429);
    });

    it('returns 500 for generic errors', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockCreateAIProvider.mockRejectedValue(new Error('Something unexpected'));

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(500);
    });
  });

  // ─── Memory Integration Tests ──────────────────────────────────────────────

  describe('memory integration', () => {
    it('calls getRelevantMemories with correct userId and message', async () => {
      mockAuth({ id: 'user-42' });
      setupNewConversationTransaction();

      await POST(createRequest({ message: 'test memory' }));

      expect(mockGetRelevantMemories).toHaveBeenCalledWith('user-42', 'test memory');
    });

    it('passes memory context to streamText system param when memories exist', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockGetRelevantMemories.mockResolvedValue([{ memory: 'user likes cats' }]);
      mockFormatMemoriesForPrompt.mockReturnValue('User context: user likes cats');

      await POST(createRequest({ message: 'hello' }));

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'User context: user likes cats',
        }),
      );
    });

    it('passes system: undefined to streamText when no memories', async () => {
      mockAuth();
      setupNewConversationTransaction();
      mockGetRelevantMemories.mockResolvedValue([]);
      mockFormatMemoriesForPrompt.mockReturnValue('');

      await POST(createRequest({ message: 'hello' }));

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: undefined,
        }),
      );
    });
  });

  // ─── Fire-and-Forget Persistence Tests ─────────────────────────────────────

  describe('fire-and-forget persistence', () => {
    it('user message persistence failure does not affect response status for existing conversation', async () => {
      mockAuth({ id: 'user-1' });

      mockGetConversationById.mockResolvedValue({
        data: { id: '550e8400-e29b-41d4-a716-446655440001', userId: 'user-1' },
        error: null,
      });

      // createMessage fails
      mockCreateMessage.mockResolvedValue({
        data: null,
        error: { message: 'DB write failed' },
      });

      const response = await POST(createRequest({
        message: 'follow up',
        conversationId: '550e8400-e29b-41d4-a716-446655440001',
      }));

      // Response should still be 200 even though message persistence failed
      expect(response.status).toBe(200);
    });
  });

  // ─── Conversation Ownership Tests ──────────────────────────────────────────

  describe('conversation ownership', () => {
    it('returns 404 when conversationId not found for user', async () => {
      mockAuth({ id: 'user-1' });

      mockGetConversationById.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await POST(createRequest({
        message: 'hello',
        conversationId: '550e8400-e29b-41d4-a716-446655440001',
      }));

      expect(response.status).toBe(404);

      const body = await response.json();

      expect(body.error).toContain('Conversation not found');
    });
  });

  // ─── Existing Tests (preserved) ────────────────────────────────────────────

  describe('new conversation (no conversationId)', () => {
    it('uses db.transaction() to create conversation and message atomically', async () => {
      mockAuth({ id: 'user-1' });
      setupNewConversationTransaction();

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(200);
      expect(mockTransaction).toHaveBeenCalledOnce();
      // createConversation (standalone) should NOT be called for new conversations
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('returns 500 if transaction fails (no orphaned conversation)', async () => {
      mockAuth({ id: 'user-1' });

      mockTransaction.mockRejectedValueOnce(new Error('Transaction rollback'));

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(500);
      // No orphaned conversation since transaction rolled back
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });
  });

  describe('existing conversation (with conversationId)', () => {
    it('does not use transaction, persists message via createMessage', async () => {
      mockAuth({ id: 'user-1' });

      mockGetConversationById.mockResolvedValue({
        data: { id: '550e8400-e29b-41d4-a716-446655440001', userId: 'user-1' },
        error: null,
      });

      mockCreateMessage.mockResolvedValue({
        data: { id: 'msg-1' },
        error: null,
      });

      const response = await POST(createRequest({
        message: 'follow up',
        conversationId: '550e8400-e29b-41d4-a716-446655440001',
      }));

      expect(response.status).toBe(200);
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockCreateMessage).toHaveBeenCalledOnce();
    });
  });

  // ─── Streaming Response Tests ──────────────────────────────────────────────

  describe('streaming response', () => {
    it('returns 200 with response from streamText().toUIMessageStreamResponse()', async () => {
      mockAuth();
      setupNewConversationTransaction();

      const response = await POST(createRequest({ message: 'hello' }));

      expect(response.status).toBe(200);
      expect(mockStreamText).toHaveBeenCalledOnce();
    });
  });
});
