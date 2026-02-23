// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DELETE,
  GET,
  PATCH,
} from '@/app/api/chat/vercel/conversations/[id]/route';
import { GET as GET_LIST } from '@/app/api/chat/vercel/conversations/route';
import * as vercelConversationsModule from '@/libs/queries/vercelConversations';
import * as vercelMessagesModule from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';

// Mock dependencies
vi.mock('@/libs/supabase/server');
vi.mock('@/libs/queries/vercelConversations');
vi.mock('@/libs/queries/vercelMessages');
vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

const mockUserId = 'user-abc';
const mockConversationId = 'conv-123';

const mockConversation = {
  id: mockConversationId,
  userId: mockUserId,
  title: 'Test Conversation',
  lastMessagePreview: 'Hello there',
  archived: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

const mockMessages = [
  {
    id: 'msg-1',
    conversationId: mockConversationId,
    role: 'user',
    content: 'Hello',
    createdAt: new Date('2025-01-01'),
  },
];

describe('/api/chat/vercel/conversations endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    };
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  // ─── GET /api/chat/vercel/conversations ───────────────────────────────────

  describe('GET /api/chat/vercel/conversations (list)', () => {
    it('returns 401 when no user session', async () => {
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No session'),
          }),
        },
      } as any);

      const request = new Request('http://localhost:3000/api/chat/vercel/conversations') as any;
      const response = await GET_LIST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
    });

    it('returns conversations array with total count for authenticated user', async () => {
      const mockConversations = [mockConversation];

      vi.mocked(vercelConversationsModule.listUserConversations).mockResolvedValue({
        data: mockConversations,
        error: null,
      });

      const request = new Request('http://localhost:3000/api/chat/vercel/conversations') as any;
      const response = await GET_LIST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.conversations).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('caps limit at 100 and applies offset from query params', async () => {
      vi.mocked(vercelConversationsModule.listUserConversations).mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new Request(
        'http://localhost:3000/api/chat/vercel/conversations?limit=200&offset=10',
      ) as any;

      await GET_LIST(request);

      // limit should be capped at 100
      expect(vercelConversationsModule.listUserConversations).toHaveBeenCalledWith(
        mockUserId,
        false,
        100,
        10,
      );
    });

    it('returns db error response on query failure', async () => {
      vi.mocked(vercelConversationsModule.listUserConversations).mockResolvedValue({
        data: null,
        error: new Error('DB connection failed'),
      });

      const request = new Request('http://localhost:3000/api/chat/vercel/conversations') as any;
      const response = await GET_LIST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBeDefined();
    });
  });

  // ─── GET /api/chat/vercel/conversations/[id] ──────────────────────────────

  describe('GET /api/chat/vercel/conversations/[id]', () => {
    it('returns 401 when no user session', async () => {
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No session'),
          }),
        },
      } as any);

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await GET(request, { params });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
    });

    it('returns conversation with messages for authenticated user', async () => {
      vi.mocked(vercelConversationsModule.getConversationById).mockResolvedValue({
        data: mockConversation,
        error: null,
      });
      vi.mocked(vercelMessagesModule.getConversationMessages).mockResolvedValue({
        data: mockMessages as any,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await GET(request, { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.conversation).toBeDefined();
      expect(body.messages).toHaveLength(1);
    });

    it('returns 404 when conversation does not exist or belongs to another user', async () => {
      vi.mocked(vercelConversationsModule.getConversationById).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await GET(request, { params });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  // ─── PATCH /api/chat/vercel/conversations/[id] ────────────────────────────

  describe('PATCH /api/chat/vercel/conversations/[id]', () => {
    it('returns 401 when no user session', async () => {
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No session'),
          }),
        },
      } as any);

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await PATCH(request, { params });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
    });

    it('returns 400 for invalid body (non-boolean archived)', async () => {
      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: 'not-a-boolean' }),
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await PATCH(request, { params });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('updates conversation title and returns updated conversation for owner', async () => {
      const updatedConversation = { ...mockConversation, title: 'Updated Title' };

      vi.mocked(vercelConversationsModule.updateConversation).mockResolvedValue({
        data: updatedConversation,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await PATCH(request, { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.conversation.title).toBe('Updated Title');
    });

    it('returns 404 when conversation does not exist during PATCH', async () => {
      vi.mocked(vercelConversationsModule.updateConversation).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await PATCH(request, { params });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.code).toBe('NOT_FOUND');
    });
  });

  // ─── DELETE /api/chat/vercel/conversations/[id] ───────────────────────────

  describe('DELETE /api/chat/vercel/conversations/[id]', () => {
    it('returns 401 when no user session', async () => {
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No session'),
          }),
        },
      } as any);

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'DELETE',
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await DELETE(request, { params });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe('AUTH_REQUIRED');
    });

    it('returns 204 on successful deletion', async () => {
      vi.mocked(vercelConversationsModule.deleteConversation).mockResolvedValue({
        data: mockConversation,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'DELETE',
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await DELETE(request, { params });

      expect(response.status).toBe(204);
    });

    it('returns 404 when conversation does not exist during DELETE', async () => {
      vi.mocked(vercelConversationsModule.deleteConversation).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new Request(`http://localhost:3000/api/chat/vercel/conversations/${mockConversationId}`, {
        method: 'DELETE',
      }) as any;
      const params = Promise.resolve({ id: mockConversationId });
      const response = await DELETE(request, { params });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.code).toBe('NOT_FOUND');
    });
  });
});
