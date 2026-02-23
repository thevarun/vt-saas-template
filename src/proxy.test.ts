// @vitest-environment node
import type { NextFetchEvent } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks so vi.mock factories can reference them
const { mockGetUser, mockIsAdmin, mockCreateClient, mockUpdateSession } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockIsAdmin = vi.fn().mockReturnValue(false);
  const mockCreateClient = vi.fn();
  const mockUpdateSession = vi.fn().mockResolvedValue(undefined);
  return { mockGetUser, mockIsAdmin, mockCreateClient, mockUpdateSession };
});

// Mock next-intl/middleware (factory-only, no external vars)
vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => (_req: NextRequest) => NextResponse.next()),
}));

vi.mock('@/libs/supabase/middleware', () => ({
  createClient: mockCreateClient,
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
    mockUpdateSession.mockResolvedValue(undefined);
    // Default: set up createClient to return mock supabase
    mockCreateClient.mockReturnValue({
      auth: { getUser: mockGetUser },
    });
  });

  it('allows unauthenticated access to public routes', async () => {
    // Public route like /en - no auth check needed
    const request = makeRequest('/en');
    const response = await proxy(request, fakeEvent);

    // Should pass through (not redirect)
    expect(response.status).not.toBe(401);

    // getUser should NOT be called for public routes
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated user from /en/dashboard to /en/sign-in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest('/en/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307); // NextResponse.redirect uses 307

    const location = response.headers.get('location');

    expect(location).toContain('/en/sign-in');
    expect(location).toContain('redirect=');
  });

  it('returns 401 JSON for unauthenticated request to /api/chat', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest('/api/chat');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('Unauthorized');
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  it('redirects unverified user from /en/dashboard to /en/verify-email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: unverifiedUser } });

    const request = makeRequest('/en/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/en/verify-email');
    expect(location).toContain('email=');
  });

  it('redirects non-admin user from /en/admin to /en/dashboard with error param', async () => {
    mockGetUser.mockResolvedValue({ data: { user: verifiedUser } });
    mockIsAdmin.mockReturnValue(false);

    const request = makeRequest('/en/admin');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/en/dashboard');
    expect(location).toContain('error=access_denied');
  });

  it('allows admin user to access /en/admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: verifiedUser } });
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
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = makeRequest('/hi/dashboard');
    const response = await proxy(request, fakeEvent);

    expect(response.status).toBe(307);

    const location = response.headers.get('location');

    expect(location).toContain('/hi/sign-in');
  });

  it('allows verified authenticated user to pass through protected routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: verifiedUser } });

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
});
