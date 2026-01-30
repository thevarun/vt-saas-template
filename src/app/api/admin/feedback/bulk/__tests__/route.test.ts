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

const mockTxUpdate = vi.fn();
const mockTxDelete = vi.fn();

vi.mock('@/libs/DB', () => ({
  db: {
    transaction: async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        update: () => {
          mockTxUpdate();
          return { set: () => ({ where: vi.fn() }) };
        },
        delete: () => {
          mockTxDelete();
          return { where: vi.fn() };
        },
      };
      await fn(tx);
    },
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
const IDS = ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'];

function createMockRequest(body: unknown): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('POST /api/admin/feedback/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_USER_ID } }, error: null });
    mockIsAdmin.mockReturnValue(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No') });
    const response = await POST(createMockRequest({ action: 'delete', ids: IDS }));

    expect(response.status).toBe(401);
  });

  it('returns 403 when not admin', async () => {
    mockIsAdmin.mockReturnValue(false);
    const response = await POST(createMockRequest({ action: 'delete', ids: IDS }));

    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid action', async () => {
    const response = await POST(createMockRequest({ action: 'invalid', ids: IDS }));

    expect(response.status).toBe(400);
  });

  it('returns 400 for empty ids', async () => {
    const response = await POST(createMockRequest({ action: 'delete', ids: [] }));

    expect(response.status).toBe(400);
  });

  it('returns 200 for bulk mark-reviewed', async () => {
    const response = await POST(createMockRequest({ action: 'mark-reviewed', ids: IDS }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(mockTxUpdate).toHaveBeenCalled();
  });

  it('returns 200 for bulk delete', async () => {
    const response = await POST(createMockRequest({ action: 'delete', ids: IDS }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(mockTxDelete).toHaveBeenCalled();
  });

  it('logs bulk action', async () => {
    await POST(createMockRequest({ action: 'delete', ids: IDS }));

    expect(mockLogAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'feedback_bulk_delete',
      targetType: 'feedback',
      metadata: expect.objectContaining({ count: 2 }),
    }));
  });
});
