// @vitest-environment node
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const {
  mockExchangeCodeForSession,
  mockGetUser,
  mockCookiesStore,
  mockSendWelcomeEmail,
  mockCreateServerClient,
} = vi.hoisted(() => {
  const mockExchangeCodeForSession = vi.fn();
  const mockGetUser = vi.fn();
  const mockCookiesStore = {
    get: vi.fn(),
    set: vi.fn(),
  };
  const mockSendWelcomeEmail = vi.fn().mockResolvedValue(undefined);
  const mockCreateServerClient = vi.fn();
  return {
    mockExchangeCodeForSession,
    mockGetUser,
    mockCookiesStore,
    mockSendWelcomeEmail,
    mockCreateServerClient,
  };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookiesStore),
}));

vi.mock('@/libs/email', () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

// eslint-disable-next-line import/first
import { GET } from './route';

function makeRequest(url: string): NextRequest {
  return {
    url,
  } as unknown as NextRequest;
}

const EXISTING_USER_CREATED_AT = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago (old user)
const NEW_USER_CREATED_AT = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago (new user)

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default Supabase mock
    mockCreateServerClient.mockReturnValue({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
        getUser: mockGetUser,
      },
    });

    // Default: code exchange succeeds
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    // Default: existing user
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          created_at: EXISTING_USER_CREATED_AT,
          user_metadata: { name: 'Test User' },
        },
      },
    });
  });

  it('exchanges code for session and redirects to next param for existing user', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123&next=/en/dashboard');
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/en/dashboard');
  });

  it('sends welcome email for new user signup via OAuth', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-new',
          email: 'new@example.com',
          created_at: NEW_USER_CREATED_AT,
          user_metadata: { name: 'New User' },
        },
      },
    });

    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123&next=/en/dashboard');

    await GET(request);

    // Welcome email should be called (fire-and-forget, so we check it was called)
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith('new@example.com', 'New User');
  });

  it('does not send welcome email for existing user re-auth', async () => {
    // Existing user - created more than 5 min ago
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'existing@example.com',
          created_at: EXISTING_USER_CREATED_AT,
          user_metadata: {},
        },
      },
    });

    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123&next=/en/dashboard');

    await GET(request);

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('redirects to auth-code-error page when code is absent', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?next=/en/dashboard');
    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('auth-code-error');
  });

  it('redirects to auth-code-error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('exchange failed') });

    const request = makeRequest('http://localhost:3000/api/auth/callback?code=bad-code&next=/en/dashboard');
    const response = await GET(request);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('auth-code-error');
  });

  it('sanitizes next param that lacks leading slash to prevent open redirect', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123&next=https://evil.com');
    const response = await GET(request);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    // Should redirect to root, not external URL
    expect(location).not.toContain('evil.com');
  });

  it.each([
    ['/\\evil.com', 'backslash (normalizes to http://evil.com)'],
    ['/\\/evil.com', 'backslash + slash'],
    ['//evil.com', 'protocol-relative'],
    ['https://evil.com', 'absolute external'],
  ])('never redirects to an external origin for next=%s (%s)', async (next) => {
    const request = makeRequest(
      `http://localhost:3000/api/auth/callback?code=abc123&next=${encodeURIComponent(next)}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(307);

    const location = response.headers.get('location')!;

    // The location header is an absolute URL — its origin must stay same-origin.
    expect(new URL(location).origin).toBe('http://localhost:3000');
    expect(location).not.toContain('evil.com');
  });

  it('honours a safe internal next param (origin stays local)', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123&next=/en/dashboard');
    const response = await GET(request);

    const location = response.headers.get('location')!;

    expect(new URL(location).origin).toBe('http://localhost:3000');
    expect(location).toContain('/en/dashboard');
  });

  it('redirects to / when next param is not provided', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?code=abc123');
    const response = await GET(request);

    expect(response.status).toBe(307);

    // Should redirect to root or base URL
    const location = response.headers.get('location');

    expect(location).toBeDefined();
  });

  it('extracts locale from next param for auth-code-error redirect', async () => {
    const request = makeRequest('http://localhost:3000/api/auth/callback?next=/hi/dashboard');
    const response = await GET(request);

    // No code - should redirect to error page with locale prefix
    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/hi/auth-code-error');
  });
});
