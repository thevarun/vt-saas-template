import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/libs/supabase/server';

import { GET } from './route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/dify/client', () => ({
  createDifyClient: vi.fn(() => ({
    getMessages: vi.fn().mockResolvedValue({ data: [] }),
  })),
}));

vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GET /api/chat/messages', () => {
  const mockCookieStore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks()
    ;(cookies as any).mockResolvedValue(mockCookieStore)
    ;(createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    });
  });

  it('returns 400 when conversation_id is missing', async () => {
    const request = new Request('http://localhost/api/chat/messages');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when conversation_id contains SQL injection characters', async () => {
    const request = new Request('http://localhost/api/chat/messages?conversation_id=\'; DROP TABLE --');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when conversation_id is longer than 128 characters', async () => {
    const longId = 'a'.repeat(129);
    const request = new Request(`http://localhost/api/chat/messages?conversation_id=${longId}`);
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when conversation_id contains path traversal characters', async () => {
    const request = new Request('http://localhost/api/chat/messages?conversation_id=../../../etc/passwd');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('accepts valid alphanumeric-with-hyphens conversation_id', async () => {
    const request = new Request('http://localhost/api/chat/messages?conversation_id=abc-123-def-456');
    const response = await GET(request);

    // Should not be 400 (might be 200 or 500 depending on Dify mock)
    expect(response.status).not.toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    ;(createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    const request = new Request('http://localhost/api/chat/messages?conversation_id=abc-123');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
