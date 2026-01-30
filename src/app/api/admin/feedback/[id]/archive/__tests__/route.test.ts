import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));

const mockGetUser = vi.fn();
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => ({ auth: { getUser: mockGetUser } })),
}));

const mockIsAdmin = vi.fn();
vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: () => mockIsAdmin(),
}));

const mockSelectResult: unknown[] = [];
const mockUpdateReturningResult: unknown[] = [];

vi.mock('@/libs/DB', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectResult,
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => mockUpdateReturningResult,
        }),
      }),
    }),
  },
}));

const mockLogAdminAction = vi.fn().mockResolvedValue(true);
vi.mock('@/libs/audit/logAdminAction', () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));

vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
  logAuthError: vi.fn(),
  logAuthzError: vi.fn(),
  logDbError: vi.fn(),
  logValidationError: vi.fn(),
}));

const { POST } = await import('../route');

const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111';
const FEEDBACK_ID = '22222222-2222-2222-2222-222222222222';

describe('POST /api/admin/feedback/[id]/archive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_USER_ID } }, error: null });
    mockIsAdmin.mockReturnValue(true);
    mockSelectResult.length = 0;
    mockSelectResult.push({ id: FEEDBACK_ID, type: 'feature', status: 'pending' });
    mockUpdateReturningResult.length = 0;
    mockUpdateReturningResult.push({ id: FEEDBACK_ID, type: 'feature', status: 'archived' });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No') });
    const response = await POST({} as NextRequest, { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockIsAdmin.mockReturnValue(false);
    const response = await POST({} as NextRequest, { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(403);
  });

  it('returns 404 when feedback not found', async () => {
    mockSelectResult.length = 0;
    const response = await POST({} as NextRequest, { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    const response = await POST({} as NextRequest, { params: Promise.resolve({ id: FEEDBACK_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('logs audit action on success', async () => {
    await POST({} as NextRequest, { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(mockLogAdminAction).toHaveBeenCalledWith({
      adminId: ADMIN_USER_ID,
      action: 'feedback_archive',
      targetType: 'feedback',
      targetId: FEEDBACK_ID,
      metadata: { feedbackType: 'feature' },
    });
  });
});
