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
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@/libs/vercel-ai/config', () => ({
  isConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: () => new Response('streamed'),
    text: Promise.resolve('AI response'),
    usage: Promise.resolve({ totalTokens: 10 }),
  }),
}));

vi.mock('@/libs/vercel-ai/client', () => ({
  createAIProvider: vi.fn().mockResolvedValue('mock-model'),
}));

vi.mock('@/libs/mem0/retrieval', () => ({
  getRelevantMemories: vi.fn().mockResolvedValue([]),
  formatMemoriesForPrompt: vi.fn().mockReturnValue(''),
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

describe('POST /api/chat/vercel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateConversation.mockResolvedValue({ data: null, error: null });
  });

  it('returns 401 without authentication', async () => {
    mockAuth(null);
    const response = await POST(createRequest({ message: 'hello' }));

    expect(response.status).toBe(401);
  });

  describe('new conversation (no conversationId)', () => {
    it('uses db.transaction() to create conversation and message atomically', async () => {
      mockAuth({ id: 'user-1' });

      // Mock the transaction to execute the callback and track what happens
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
});
