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

const mockGetFeedbackList = vi.fn();
vi.mock('@/libs/queries/feedback', () => ({
  getFeedbackList: (...args: unknown[]) => mockGetFeedbackList(...args),
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

const { GET } = await import('../route');

const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111';

function createMockRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/admin/feedback/export');
  Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
  return {
    nextUrl: url,
  } as unknown as NextRequest;
}

describe('GET /api/admin/feedback/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_USER_ID } }, error: null });
    mockIsAdmin.mockReturnValue(true);
    mockGetFeedbackList.mockResolvedValue([
      {
        id: 'fb-1',
        type: 'bug',
        message: 'Test bug',
        email: 'test@example.com',
        status: 'pending',
        userId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        reviewedAt: null,
      },
    ]);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No') });
    const response = await GET(createMockRequest());

    expect(response.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockIsAdmin.mockReturnValue(false);
    const response = await GET(createMockRequest());

    expect(response.status).toBe(403);
  });

  it('returns CSV on success', async () => {
    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=feedback-');

    const csv = await response.text();

    expect(csv).toContain('ID,Type,Status,Message,Email');
    expect(csv).toContain('fb-1');
    expect(csv).toContain('bug');
  });

  it('passes filters to getFeedbackList', async () => {
    await GET(createMockRequest({ type: 'bug', status: 'pending' }));

    expect(mockGetFeedbackList).toHaveBeenCalledWith({
      type: 'bug',
      status: 'pending',
      limit: 10000,
    });
  });

  it('logs export action', async () => {
    await GET(createMockRequest());

    expect(mockLogAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'feedback_export',
      targetType: 'feedback',
    }));
  });
});
