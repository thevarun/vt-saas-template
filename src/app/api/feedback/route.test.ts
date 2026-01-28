import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('POST /api/feedback', () => {
  const mockCookieStore = {} as any;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks()
    ;(cookies as any).mockResolvedValue(mockCookieStore);
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
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

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
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

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
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

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

    it('accepts anonymous feedback with email', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'bug',
        message: 'Anonymous bug report',
        status: 'pending',
        userId: null,
        userEmail: 'anonymous@example.com',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Anonymous bug report',
          email: 'anonymous@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.message).toBe('Anonymous bug report');
    });

    it('accepts anonymous feedback without email', async () => {
      const mockFeedback = {
        id: 'feedback-id',
        type: 'feature',
        message: 'Anonymous feature request',
        status: 'pending',
        userId: null,
        userEmail: null,
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feature',
          message: 'Anonymous feature request',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.message).toBe('Anonymous feature request');
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
      }

      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockFeedback]),
        }),
      })

      ;(db.insert as any) = mockInsert;

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

  describe('Validation errors', () => {
    it('returns 400 for empty message', async () => {
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

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

    it('returns 400 for missing message', async () => {
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

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
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

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

    it('returns 400 for invalid email format', async () => {
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

      const request = new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          message: 'Test message',
          email: 'invalid-email',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.details).toBeDefined();
    });

    it('returns 400 for invalid feedback type', async () => {
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

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
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      });

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
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      })

      ;(db.insert as any) = mockInsert;

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
      ;(createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      })

      ;(db.insert as any) = mockInsert;

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
