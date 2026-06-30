// @vitest-environment node
import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as rateLimit from '@/libs/api/rateLimit';

const { mockCookiesStore, mockCreateServerClient } = vi.hoisted(() => {
  const mockCookiesStore = {
    get: vi.fn(),
    set: vi.fn(),
  };
  const mockCreateServerClient = vi.fn();
  return { mockCookiesStore, mockCreateServerClient };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookiesStore),
}));

// eslint-disable-next-line import/first -- mocks must be hoisted above imports under test
import { POST } from './route';

function makeRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: vi.fn().mockReturnValue(null),
    },
  } as unknown as NextRequest;
}

describe('POST /api/auth/dev-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit._resetStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rateLimit._resetStore();
  });

  describe('production guard', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('returns 403 with error message when called in production', async () => {
      const response = await POST(makeRequest({ email: 'test@test.com', password: 'password' }));

      expect(response.status).toBe(403);

      const body = await response.json();

      expect(body).toEqual({ error: 'This endpoint is only available in development' });
    });

    it('never calls createServerClient in production', async () => {
      await POST(makeRequest({ email: 'test@test.com', password: 'password' }));

      expect(mockCreateServerClient).not.toHaveBeenCalled();
    });
  });

  describe('development sanity', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOW_DEV_LOGIN', 'true');
      // Default to a local-dev-looking Supabase URL so the prod refusal doesn't kick in.
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    });

    it('returns 400 when email/password are missing', async () => {
      const response = await POST(makeRequest({}));

      expect(response.status).toBe(400);

      const body = await response.json();

      expect(body).toEqual({ error: 'email and password are required' });
    });
  });

  // Hardened env guard + per-IP rate limit.
  describe('env guard', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('returns 403 when ALLOW_DEV_LOGIN is not set', async () => {
      vi.stubEnv('ALLOW_DEV_LOGIN', '');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');

      const res = await POST(makeRequest({ email: 't@t.com', password: 'pw' }));

      expect(res.status).toBe(403);

      const body = await res.json();

      expect(body.error).toContain('ALLOW_DEV_LOGIN');
      // Should never reach Supabase client construction.
      expect(mockCreateServerClient).not.toHaveBeenCalled();
    });

    it('returns 403 when Supabase URL is in PRODUCTION_SUPABASE_URLS deny-list', async () => {
      vi.stubEnv('ALLOW_DEV_LOGIN', 'true');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://prod-project-id.supabase.co');
      vi.stubEnv('PRODUCTION_SUPABASE_URLS', 'https://prod-project-id.supabase.co');

      const res = await POST(makeRequest({ email: 't@t.com', password: 'pw' }));

      expect(res.status).toBe(403);
      expect(mockCreateServerClient).not.toHaveBeenCalled();
    });

    it('allows login when ALLOW_DEV_LOGIN=true + non-prod Supabase URL', async () => {
      vi.stubEnv('ALLOW_DEV_LOGIN', 'true');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

      mockCreateServerClient.mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'u1', email: 't@t.com' } },
            error: null,
          }),
        },
      });

      const res = await POST(makeRequest({ email: 't@t.com', password: 'pw' }));

      expect(res.status).toBe(200);
    });

    it('per-IP rate limit: 10 attempts allowed, 11th returns 429', async () => {
      vi.stubEnv('ALLOW_DEV_LOGIN', 'true');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
      vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

      mockCreateServerClient.mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid login' },
          }),
        },
      });

      const statuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const res = await POST(makeRequest({ email: 't@t.com', password: 'wrong' }));
        statuses.push(res.status);
      }

      // First 10: 401 invalid credentials. 11th: 429 from rate limit.
      expect(statuses.slice(0, 10).every(s => s === 401)).toBe(true);
      expect(statuses[10]).toBe(429);
    });
  });
});
