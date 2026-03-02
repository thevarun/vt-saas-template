import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as rateLimit from '@/libs/api/rateLimit';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';

import { POST } from './route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/libs/api/rateLimit', () => ({
  checkRateLimit: vi.fn(),
}));

describe('POST /api/feedback', () => {
  const mockCookieStore = {} as any;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks()
    ;(cookies as any).mockResolvedValue(mockCookieStore)
    // Default: rate limit allows requests
    ;(rateLimit.checkRateLimit as any).mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  });

  function mockAuth(user: { id: string; email: string } | null = mockUser) {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: user ? null : new Error('Not authenticated'),
        }),
      },
    });
  }

  describe('Authentication', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockAuth(null);

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('Valid submissions', () => {
    it('accepts bug feedback from authenticated user', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'bug',
        message: 'Test bug report',
        status: 'pending',
        userId: mockUser.id,
        userEmail: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      };

      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test bug report',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.type).toBe('bug');
      expect(data.data.message).toBe('Test bug report');
      expect(data.data.status).toBe('pending');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('accepts feature feedback from authenticated user', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'feature',
        message: 'Test feature request',
        status: 'pending',
        userId: mockUser.id,
        userEmail: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      };

      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feature',
          message: 'Test feature request',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.type).toBe('feature');
    });

    it('accepts praise feedback from authenticated user', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'praise',
        message: 'Test praise',
        status: 'pending',
        userId: mockUser.id,
        userEmail: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      };

      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'praise',
          message: 'Test praise',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.type).toBe('praise');
    });

    it('does not return sensitive fields in response', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'bug',
        message: 'Test message',
        status: 'pending',
        userId: mockUser.id,
        userEmail: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      };

      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('type');
      expect(data.data).toHaveProperty('message');
      expect(data.data).toHaveProperty('status');
      expect(data.data).toHaveProperty('createdAt');
      expect(data.data).not.toHaveProperty('userId');
      expect(data.data).not.toHaveProperty('userEmail');
    });
  });

  describe('Rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      mockAuth();
      (rateLimit.checkRateLimit as any).mockReturnValue({ allowed: false, retryAfterSeconds: 3600 });

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('RATE_LIMIT');
      expect(response.headers.get('Retry-After')).toBe('3600');
    });
  });

  describe('Validation errors', () => {
    it('returns 400 for empty message', async () => {
      mockAuth();

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('returns 400 for whitespace-only message', async () => {
      mockAuth();

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: '   \n\t  ',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for missing message', async () => {
      mockAuth();

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for message exceeding 1000 characters', async () => {
      mockAuth();

      const longMessage = 'a'.repeat(1001);

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: longMessage,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('returns 400 for invalid feedback type', async () => {
      mockAuth();

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'invalid-type',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('returns 400 for missing feedback type', async () => {
      mockAuth();

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error handling', () => {
    it('returns 500 when database insert fails', async () => {
      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('returns 500 when database throws error', async () => {
      mockAuth();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });
});
