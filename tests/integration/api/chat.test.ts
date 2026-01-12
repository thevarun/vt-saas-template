import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/chat/route';
import { createDifyClient } from '@/libs/dify/client';
import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/supabase/server';

/**
 * Integration tests for /api/chat endpoint
 *
 * Acceptance Criteria Coverage:
 * - AC #1: Validates Supabase session before proxying requests
 * - AC #2: Unauthorized requests return 401 with appropriate error message
 * - AC #3: Valid requests successfully proxy to Dify API
 * - AC #4: Streaming responses (SSE) work correctly
 * - AC #5: Dify API errors are caught and returned appropriately
 * - AC #7: Integration tests pass for chat API route
 */

// Mock dependencies
vi.mock('@/libs/supabase/server');
vi.mock('@/libs/dify/client');
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

describe('/api/chat POST endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1 & #2: Session Validation', () => {
    it('should return 401 when no user session exists', async () => {
      // Mock Supabase to return no user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('No session'),
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should return 401 when user session is invalid', async () => {
      // Mock Supabase to return auth error
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('AC #3: Request Validation and Proxy', () => {
    it('should return 400 when message is missing', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_REQUEST');
    });

    it('should proxy valid request to Dify API', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // Mock Dify client
      const mockStream = new ReadableStream();
      const mockDifyClient = {
        chatMessages: vi.fn().mockResolvedValue(mockStream),
      };
      vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello, how are you?',
          conversationId: 'conv-123',
        }),
      });

      const response = await POST(request as any);

      expect(mockDifyClient.chatMessages).toHaveBeenCalledWith({
        query: 'Hello, how are you?',
        user: 'test-user-123',
        response_mode: 'streaming',
        conversation_id: 'conv-123',
        inputs: {},
      });
      expect(response.status).toBe(200);
    });
  });

  describe('AC #4: Streaming Response', () => {
    it('should return streaming response with correct headers', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // Mock Dify client with streaming response
      const mockStream = new ReadableStream();
      const mockDifyClient = {
        chatMessages: vi.fn().mockResolvedValue(mockStream),
      };
      vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' }),
      });

      const response = await POST(request as any);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
    });
  });

  describe('AC #5: Error Handling', () => {
    it('should handle Dify API errors gracefully', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // Mock Dify client to throw error
      const difyError = {
        status: 500,
        code: 'DIFY_ERROR',
        message: 'Internal Dify error',
      };
      const mockDifyClient = {
        chatMessages: vi.fn().mockRejectedValue(difyError),
      };
      vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('DIFY_ERROR');
      expect(data.error).toBe('Internal Dify error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle rate limiting errors', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // Mock Dify client to throw rate limit error
      const rateLimitError = {
        status: 429,
        code: 'RATE_LIMIT',
        message: 'Too many requests',
      };
      const mockDifyClient = {
        chatMessages: vi.fn().mockRejectedValue(rateLimitError),
      };
      vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('RATE_LIMIT');
    });

    it('should handle generic errors with 500 status', async () => {
      // Mock valid Supabase session
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-123' } },
            error: null,
          }),
        },
      };
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // Mock Dify client to throw generic error
      const mockDifyClient = {
        chatMessages: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      vi.mocked(createDifyClient).mockReturnValue(mockDifyClient as any);

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Test message' }),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
