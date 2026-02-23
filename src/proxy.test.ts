// @vitest-environment node
import type { NextFetchEvent } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks so vi.mock factories can reference them
const { mockIsAdmin, mockUpdateSession } = vi.hoisted(() => {
  const mockIsAdmin = vi.fn().mockReturnValue(false);
  const mockUpdateSession = vi.fn();
  return { mockIsAdmin, mockUpdateSession };
});

// Mock next-intl/middleware (factory-only, no external vars)
vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => (_req: NextRequest) => NextResponse.next()),
}));

vi.mock('@/libs/supabase/middleware', () => ({
  updateSession: mockUpdateSession,
}));

vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: mockIsAdmin,
}));

// eslint-disable-next-line import/first
import { proxy } from './proxy';

// Helper: build a NextRequest
function makeRequest(pathname: string, origin = 'http://localhost:3000') {
  return new NextRequest(new URL(pathname, origin));
}

const fakeEvent = {} as NextFetchEvent;

// Authenticated, verified user (not admin)
const verifiedUser = {
  id: 'uid-1',
  email: 'user@test.com',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  user_metadata: {},
};

// Authenticated, email NOT verified
const unverifiedUser = {
  id: 'uid-2',
  email: 'unverified@test.com',
  email_confirmed_at: null,
  user_metadata: {},
};

describe('proxy middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockReturnValue(false);
    mockUpdateSession.mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    });
  });

  it('allows unauthenticated access to public routes', async () => {
    // Public route like /en - no auth check needed
    const request = makeRequest('/en');
    const response = await proxy(request, fakeEvent);

    // Should pass through (not redirect)
    expect(response.status).not.toBe(401);

    // updateSession is still called for session refresh
    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it('redirects unauthenticated user from /en/dashboard to /en/sign-in', async () => {
    mockUpdateSession.mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    });

    const request = makeRequest('/en/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307); // NextResponse.redirect uses 307

    const location = response.headers.get('location');

    expect(location).toContain('/en/sign-in');
    expect(location).toContain('redirect=');
  });

  it('returns 401 JSON for unauthenticated request to /api/chat', async () => {
    mockUpdateSession.mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    });

    const request = makeRequest('/api/chat');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('Unauthorized');
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  it('redirects unverified user from /en/dashboard to /en/verify-email', async () => {
    mockUpdateSession.mockResolvedValue({
      user: unverifiedUser,
      response: NextResponse.next(),
    });

    const request = makeRequest('/en/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/en/verify-email');
    expect(location).toContain('email=');
  });

  it('redirects non-admin user from /en/admin to /en/dashboard with error param', async () => {
    mockUpdateSession.mockResolvedValue({
      user: verifiedUser,
      response: NextResponse.next(),
    });
    mockIsAdmin.mockReturnValue(false);

    const request = makeRequest('/en/admin');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/en/dashboard');
    expect(location).toContain('error=access_denied');
  });

  it('allows admin user to access /en/admin', async () => {
    mockUpdateSession.mockResolvedValue({
      user: verifiedUser,
      response: NextResponse.next(),
    });
    mockIsAdmin.mockReturnValue(true);

    const request = makeRequest('/en/admin');
    const response = await proxy(request, fakeEvent);

    // Should pass through (not redirect to dashboard with access_denied)
    const location = response.headers.get('location');

    if (location) {
      expect(location).not.toContain('access_denied');
    } else {
      expect(response.status).not.toBe(307);
    }
  });

  it('includes /hi locale prefix in sign-in redirect URL', async () => {
    mockUpdateSession.mockResolvedValue({
      user: null,
      response: NextResponse.next(),
    });

    const request = makeRequest('/hi/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/hi/sign-in');
  });

  it('allows verified authenticated user to pass through protected routes', async () => {
    mockUpdateSession.mockResolvedValue({
      user: verifiedUser,
      response: NextResponse.next(),
    });

    const request = makeRequest('/en/dashboard');
    const response = await proxy(request, fakeEvent);

    // Should NOT redirect to sign-in
    const location = response.headers.get('location');

    if (location) {
      expect(location).not.toContain('sign-in');
    } else {
      // No redirect - passed through
      expect(response.status).not.toBe(307);
    }
  });

  // New tests for precise segment matching (F-030)
  it('does not trigger auth check for path with protected word in non-segment position', async () => {
    // 'chatty' includes 'chat' as substring but is not a protected path segment
    const request = makeRequest('/en/chatty');
    const response = await proxy(request, fakeEvent);

    expect(mockUpdateSession).toHaveBeenCalled(); // session still updates
    // Should not redirect — passes through since /chatty is not /chat
    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(401);
  });

  it('treats /hi/admin as an admin route (locale-prefixed)', async () => {
    mockUpdateSession.mockResolvedValue({
      user: verifiedUser,
      response: NextResponse.next(),
    });
    mockIsAdmin.mockReturnValue(false);

    const request = makeRequest('/hi/admin');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/hi/dashboard');
    expect(location).toContain('error=access_denied');
  });
});
