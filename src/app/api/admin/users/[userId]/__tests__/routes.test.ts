import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock supabase client
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock admin client
const mockUpdateUserById = vi.fn();
const mockDeleteUser = vi.fn();
const mockGetUserById = vi.fn();
const mockResetPasswordForEmail = vi.fn();

const mockSupabaseAdminClient = {
  auth: {
    admin: {
      updateUserById: mockUpdateUserById,
      deleteUser: mockDeleteUser,
      getUserById: mockGetUserById,
    },
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
};

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseAdminClient),
}));

// Mock isAdmin
const mockIsAdmin = vi.fn();
vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: () => mockIsAdmin(),
}));

// Mock logApiError to avoid Sentry dependency in tests
vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
  logAuthError: vi.fn(),
  logAuthzError: vi.fn(),
  logDbError: vi.fn(),
  logValidationError: vi.fn(),
}));

// Mock audit logging
const mockLogAdminAction = vi.fn().mockResolvedValue(true);
vi.mock('@/libs/audit/logAdminAction', () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));

// Mock getBaseUrl for reset-password redirect verification
vi.mock('@/utils/Helpers', () => ({
  getBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

// Import route handlers after mocks
const { POST: suspendHandler } = await import('../suspend/route');
const { POST: unsuspendHandler } = await import('../unsuspend/route');
const { DELETE: deleteHandler } = await import('../route');
const { POST: resetPasswordHandler } = await import('../reset-password/route');

// Helper to create mock request
function createMockRequest(body?: Record<string, unknown>): NextRequest {
  return {
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error('No body')),
  } as unknown as NextRequest;
}

// Valid UUIDs for testing
const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111';
const TARGET_USER_ID = '22222222-2222-2222-2222-222222222222';
const VALID_USER_ID = '12345678-1234-1234-1234-123456789012';

// Mock admin user
const mockAdminUser: User = {
  id: ADMIN_USER_ID,
  email: 'admin@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { admin: true },
  user_metadata: {},
} as User;

// Mock target user
const mockTargetUser: User = {
  id: TARGET_USER_ID,
  email: 'target@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
} as User;

describe('Admin User API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated admin user
    mockGetUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });
    mockIsAdmin.mockReturnValue(true);
  });

  describe('POST /api/admin/users/[userId]/suspend', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('returns 403 when not admin', async () => {
      mockIsAdmin.mockReturnValue(false);

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('returns 400 for invalid user ID format', async () => {
      const params = Promise.resolve({ userId: 'invalid-id' });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('returns 403 when trying to suspend own account', async () => {
      const params = Promise.resolve({ userId: ADMIN_USER_ID });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot suspend your own account');
    });

    it('successfully suspends a user', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID, banned_until: '9999-12-31' } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith(VALID_USER_ID, { ban_duration: '876000h' });
    });

    it('logs audit entry on successful suspend', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await suspendHandler(createMockRequest(), { params });

      expect(mockLogAdminAction).toHaveBeenCalledWith({
        action: 'suspend_user',
        targetType: 'user',
        targetId: VALID_USER_ID,
        adminId: ADMIN_USER_ID,
        metadata: undefined,
      });
    });

    it('logs audit entry with reason metadata when provided', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await suspendHandler(createMockRequest({ reason: 'Policy violation' }), { params });

      expect(mockLogAdminAction).toHaveBeenCalledWith({
        action: 'suspend_user',
        targetType: 'user',
        targetId: VALID_USER_ID,
        adminId: ADMIN_USER_ID,
        metadata: { reason: 'Policy violation' },
      });
    });

    it('still succeeds even if audit logging fails', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID } },
        error: null,
      });
      mockLogAdminAction.mockRejectedValueOnce(new Error('Logging failed'));

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await suspendHandler(createMockRequest(), { params });

      expect(response.status).toBe(200);
    });

    it('returns 500 on Supabase error', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await suspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST /api/admin/users/[userId]/unsuspend', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await unsuspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('returns 403 when not admin', async () => {
      mockIsAdmin.mockReturnValue(false);

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await unsuspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('successfully unsuspends a user', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID, banned_until: null } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await unsuspendHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith(VALID_USER_ID, { ban_duration: 'none' });
    });

    it('logs audit entry on successful unsuspend', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await unsuspendHandler(createMockRequest(), { params });

      expect(mockLogAdminAction).toHaveBeenCalledWith({
        action: 'unsuspend_user',
        targetType: 'user',
        targetId: VALID_USER_ID,
        adminId: ADMIN_USER_ID,
        metadata: undefined,
      });
    });

    it('logs audit entry with reason metadata when provided', async () => {
      mockUpdateUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, id: VALID_USER_ID } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await unsuspendHandler(createMockRequest({ reason: 'Account reviewed' }), { params });

      expect(mockLogAdminAction).toHaveBeenCalledWith({
        action: 'unsuspend_user',
        targetType: 'user',
        targetId: VALID_USER_ID,
        adminId: ADMIN_USER_ID,
        metadata: { reason: 'Account reviewed' },
      });
    });
  });

  describe('DELETE /api/admin/users/[userId]', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await deleteHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('returns 403 when not admin', async () => {
      mockIsAdmin.mockReturnValue(false);

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await deleteHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('returns 403 when trying to delete own account', async () => {
      const params = Promise.resolve({ userId: ADMIN_USER_ID });
      const response = await deleteHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot delete your own account');
    });

    it('successfully deletes a user', async () => {
      mockDeleteUser.mockResolvedValue({ error: null });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await deleteHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDeleteUser).toHaveBeenCalledWith(VALID_USER_ID);
    });

    it('returns 404 when user not found', async () => {
      mockDeleteUser.mockResolvedValue({
        error: { message: 'User not found' },
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await deleteHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('POST /api/admin/users/[userId]/reset-password', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('AUTH_REQUIRED');
    });

    it('returns 403 when not admin', async () => {
      mockIsAdmin.mockReturnValue(false);

      const params = Promise.resolve({ userId: 'target-user-id' });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('returns 403 when trying to reset own password', async () => {
      const params = Promise.resolve({ userId: ADMIN_USER_ID });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Cannot reset your own password via admin API');
    });

    it('returns 404 when user not found', async () => {
      mockGetUserById.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('returns 400 when user has no email', async () => {
      mockGetUserById.mockResolvedValue({
        data: { user: { ...mockTargetUser, email: null } },
        error: null,
      });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User does not have an email address');
    });

    it('successfully sends reset password email', async () => {
      mockGetUserById.mockResolvedValue({
        data: { user: mockTargetUser },
        error: null,
      });
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      const response = await resetPasswordHandler(createMockRequest(), { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password reset email sent');
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'target@example.com',
        expect.any(Object),
      );
    });

    it('logs audit entry on successful password reset', async () => {
      mockGetUserById.mockResolvedValue({
        data: { user: mockTargetUser },
        error: null,
      });
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await resetPasswordHandler(createMockRequest(), { params });

      expect(mockLogAdminAction).toHaveBeenCalledWith({
        action: 'reset_password',
        targetType: 'user',
        targetId: VALID_USER_ID,
        adminId: ADMIN_USER_ID,
      });
    });

    it('sends reset email with correct redirect URL', async () => {
      mockGetUserById.mockResolvedValue({
        data: { user: mockTargetUser },
        error: null,
      });
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const params = Promise.resolve({ userId: VALID_USER_ID });
      await resetPasswordHandler(createMockRequest(), { params });

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'target@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        },
      );
    });
  });
});
