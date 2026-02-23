import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock DB with chainable query builder
// GET route: db.select().from().where() -> [link] (no limit, resolves to array)
// GET route update: db.update().set().where() -> void
const mockUpdateSetWhere = vi.fn().mockResolvedValue(undefined);
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateSetWhere });
const mockUpdateFn = vi.fn().mockReturnValue({ set: mockUpdateSet });

const mockSelectWhere = vi.fn().mockResolvedValue([]);
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelectFn = vi.fn().mockReturnValue({ from: mockSelectFrom });

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelectFn(...args),
    update: (...args: unknown[]) => mockUpdateFn(...args),
  },
}));

const { GET, PATCH } = await import('../[token]/route');
const { createClient } = await import('@/libs/supabase/server');
const { cookies } = await import('next/headers');

describe('GET /api/share/[token]', () => {
  const validLink = {
    id: 'link-1',
    token: 'valid-token',
    resourceType: 'report',
    resourceId: '123e4567-e89b-12d3-a456-426614174000',
    createdBy: 'user-1',
    expiresAt: null,
    accessCount: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockResolvedValue([]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it('returns resource data for valid active token', async () => {
    mockSelectWhere.mockResolvedValueOnce([validLink]);

    const request = new NextRequest('http://localhost:3000/api/share/valid-token');
    const response = await GET(request, { params: Promise.resolve({ token: 'valid-token' }) });

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.resourceType).toBe('report');
    expect(data.resourceId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('uses SQL atomic increment for accessCount (not read-then-write)', async () => {
    mockSelectWhere.mockResolvedValueOnce([{ ...validLink, accessCount: 5 }]);

    const request = new NextRequest('http://localhost:3000/api/share/valid-token');
    await GET(request, { params: Promise.resolve({ token: 'valid-token' }) });

    expect(mockUpdateFn).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalled();

    const setArg = mockUpdateSet.mock.calls[0]![0];

    // Verify accessCount is a SQL expression (not a plain number like 6)
    expect(setArg).toHaveProperty('accessCount');
    // SQL template literal produces an object with queryChunks, not a number
    expect(typeof setArg.accessCount).not.toBe('number');
  });

  it('returns 410 for expired token', async () => {
    const expiredLink = {
      ...validLink,
      expiresAt: new Date('2020-01-01'),
    };
    mockSelectWhere.mockResolvedValueOnce([expiredLink]);

    const request = new NextRequest('http://localhost:3000/api/share/expired-token');
    const response = await GET(request, { params: Promise.resolve({ token: 'expired-token' }) });

    expect(response.status).toBe(410);
  });

  it('returns 410 for inactive token', async () => {
    const inactiveLink = { ...validLink, isActive: false };
    mockSelectWhere.mockResolvedValueOnce([inactiveLink]);

    const request = new NextRequest('http://localhost:3000/api/share/inactive-token');
    const response = await GET(request, { params: Promise.resolve({ token: 'inactive-token' }) });

    expect(response.status).toBe(410);
  });

  it('returns 410 for nonexistent token', async () => {
    mockSelectWhere.mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/share/nonexistent');
    const response = await GET(request, { params: Promise.resolve({ token: 'nonexistent' }) });

    expect(response.status).toBe(410);
  });
});

describe('PATCH /api/share/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without authentication', async () => {
    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/share/token-1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ token: 'token-1' }) });

    expect(response.status).toBe(401);
  });

  it('returns 404 with correct "Share link not found" message (not doubled)', async () => {
    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any);

    // Link not found by token + userId
    mockSelectWhere.mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/share/missing-token', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ token: 'missing-token' }) });

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('Share link not found');
    // Must NOT be "Share link not found not found"
    expect(body.error).not.toContain('not found not found');
  });
});
