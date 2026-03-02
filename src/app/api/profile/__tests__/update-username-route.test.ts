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
  logAuthError: vi.fn(),
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock DB with chainable query builder
const mockReturning = vi.fn().mockResolvedValue([]);
const mockSetWhere = vi.fn().mockReturnValue({ returning: mockReturning });
const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockLimit = vi.fn().mockResolvedValue([]);
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

const { PATCH } = await import('../update-username/route');
const { createClient } = await import('@/libs/supabase/server');
const { cookies } = await import('next/headers');

function createRequest(body: unknown) {
  return new Request('http://localhost:3000/api/profile/update-username', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockAuth(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(cookies).mockResolvedValue({} as any);
  vi.mocked(createClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  } as any);
}

describe('PATCH /api/profile/update-username', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue([]);
    mockReturning.mockResolvedValue([]);
  });

  it('returns 401 without authentication', async () => {
    mockAuth(null);
    const response = await PATCH(createRequest({ username: 'testuser' }));

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid username format', async () => {
    mockAuth();
    const response = await PATCH(createRequest({ username: 'AB' }));

    expect(response.status).toBe(400);
  });

  it('returns 409 when username is taken (explicit check)', async () => {
    mockAuth({ id: 'user-1' });

    // First call: check if username is taken -- return another user with that username
    // Second call: get current profile
    let selectCallCount = 0;
    mockLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([{ userId: 'other-user', username: 'taken_name' }]);
      }
      return Promise.resolve([]);
    });

    const response = await PATCH(createRequest({ username: 'taken_name' }));

    expect(response.status).toBe(409);
  });

  it('returns 409 when DB constraint violation (23505) occurs during race condition', async () => {
    mockAuth({ id: 'user-1' });

    // Username check passes (not found)
    // Profile check returns existing profile
    let selectCallCount = 0;
    mockLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([]); // username not taken (passes explicit check)
      }
      return Promise.resolve([{ userId: 'user-1', username: 'old_name' }]); // existing profile
    });

    // DB update throws 23505 constraint violation (race condition)
    mockUpdate.mockImplementationOnce(() => {
      const err = new Error('duplicate key value violates unique constraint') as any;
      err.code = '23505';
      throw err;
    });

    const response = await PATCH(createRequest({ username: 'race_name' }));

    // After fix: constraint violation caught and returns 409
    expect(response.status).toBe(409);

    const data = await response.json();

    expect(data.code).toBe('USERNAME_TAKEN');
  });

  it('returns 500 when DB throws non-23505 error', async () => {
    mockAuth({ id: 'user-1' });

    let selectCallCount = 0;
    mockLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([]);
      }
      return Promise.resolve([{ userId: 'user-1', username: 'old_name' }]);
    });

    // DB update throws a non-constraint error
    mockUpdate.mockImplementationOnce(() => {
      const err = new Error('Connection timeout');
      throw err;
    });

    const response = await PATCH(createRequest({ username: 'timeout_name' }));

    expect(response.status).toBe(500);
  });

  it('returns 200 with valid unique username (update existing)', async () => {
    mockAuth({ id: 'user-1' });

    // Username check: not taken
    // Profile check: existing profile
    let selectCallCount = 0;
    mockLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve([]);
      }
      return Promise.resolve([{ userId: 'user-1', username: 'old_name' }]);
    });

    const response = await PATCH(createRequest({ username: 'new_name' }));

    expect(response.status).toBe(200);
  });

  it('returns 200 with valid unique username (insert new)', async () => {
    mockAuth({ id: 'user-1' });

    // Username check: not taken
    // Profile check: no existing profile
    mockLimit.mockResolvedValue([]);

    const response = await PATCH(createRequest({ username: 'brand_new' }));

    expect(response.status).toBe(200);
  });
});
