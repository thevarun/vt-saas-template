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
  auth: { getUser: mockGetUser },
};

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock isAdmin
const mockIsAdmin = vi.fn();
vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: () => mockIsAdmin(),
}));

// Mock DB
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockSet = vi.fn();
const mockReturning = vi.fn();

let mockLimitResult: unknown[] = [];
let mockReturningResult: unknown[] = [];

vi.mock('@/libs/DB', () => ({
  db: {
    select: () => {
      mockSelect();
      return {
        from: () => {
          mockFrom();
          return {
            where: (w: unknown) => {
              mockWhere(w);
              return {
                limit: () => {
                  mockLimit();
                  return mockLimitResult;
                },
              };
            },
          };
        },
      };
    },
    update: () => {
      mockUpdate();
      return {
        set: (v: unknown) => {
          mockSet(v);
          return {
            where: () => {
              mockWhere();
              return {
                returning: () => {
                  mockReturning();
                  return mockReturningResult;
                },
              };
            },
          };
        },
      };
    },
  },
}));

// Mock audit logging
const mockLogAdminAction = vi.fn().mockResolvedValue(true);
vi.mock('@/libs/audit/logAdminAction', () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));

// Mock logger
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

function createMockRequest(): NextRequest {
  return {} as unknown as NextRequest;
}

describe('POST /api/admin/feedback/[id]/mark-reviewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: ADMIN_USER_ID } },
      error: null,
    });
    mockIsAdmin.mockReturnValue(true);
    mockLimitResult = [{ id: FEEDBACK_ID, type: 'bug', status: 'pending' }];
    mockReturningResult = [{ id: FEEDBACK_ID, type: 'bug', status: 'reviewed', reviewedAt: new Date() }];
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Not auth') });

    const response = await POST(createMockRequest(), { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockIsAdmin.mockReturnValue(false);

    const response = await POST(createMockRequest(), { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(403);
  });

  it('returns 404 when feedback not found', async () => {
    mockLimitResult = [];

    const response = await POST(createMockRequest(), { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(response.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    const response = await POST(createMockRequest(), { params: Promise.resolve({ id: FEEDBACK_ID }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('logs audit action on success', async () => {
    await POST(createMockRequest(), { params: Promise.resolve({ id: FEEDBACK_ID }) });

    expect(mockLogAdminAction).toHaveBeenCalledWith({
      adminId: ADMIN_USER_ID,
      action: 'feedback_mark_reviewed',
      targetType: 'feedback',
      targetId: FEEDBACK_ID,
      metadata: { feedbackType: 'bug' },
    });
  });
});
