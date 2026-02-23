// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const {
  mockGetUser,
  mockDeleteUser,
  mockCreateClient,
  mockCreateAdminClient,
} = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockDeleteUser = vi.fn();
  const mockCreateClient = vi.fn();
  const mockCreateAdminClient = vi.fn();
  return { mockGetUser, mockDeleteUser, mockCreateClient, mockCreateAdminClient };
});

vi.mock('@/libs/supabase/server', () => ({
  createClient: mockCreateClient,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn() }),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// eslint-disable-next-line import/first
import { DELETE } from './route';

const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
};

describe('DELETE /api/profile/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockCreateClient.mockReturnValue({
      auth: { getUser: mockGetUser },
    });
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Default: admin client available
    mockDeleteUser.mockResolvedValue({ error: null });
    mockCreateAdminClient.mockReturnValue({
      auth: { admin: { deleteUser: mockDeleteUser } },
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session'),
    });

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  it('returns 503 when SUPABASE_SERVICE_ROLE_KEY is not configured', async () => {
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
    });

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toBeDefined();
  });

  it('returns 500 when Supabase admin deleteUser returns an error', async () => {
    mockDeleteUser.mockResolvedValue({ error: new Error('DB error') });

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('returns 200 and deletes user on valid authenticated request', async () => {
    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Account deleted successfully');
    expect(mockDeleteUser).toHaveBeenCalledWith(mockUser.id);
  });
});
