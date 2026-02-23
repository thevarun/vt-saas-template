import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';

import { POST } from './route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(() => ({ from: mockFrom })),
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('POST /api/profile/update', () => {
  const mockCookieStore = {} as any;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { username: 'existinguser' },
  };

  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks()
    ;(cookies as any).mockResolvedValue(mockCookieStore)
    ;(createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
        updateUser: mockUpdateUser,
      },
    });
    // Default: no existing user in DB
    mockLimit.mockResolvedValue([]);
  });

  it('returns 401 when not authenticated', async () => {
    ;(createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 when body is invalid JSON', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json{',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when username is missing', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Test User' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when displayName is missing', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when username format is invalid (special chars)', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test@user!', displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when username is too short', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab', displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when username is too long', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a'.repeat(21), displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  // F-002: displayName validation tests
  it('returns 400 when displayName is empty string', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', displayName: '' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when displayName exceeds 50 characters', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', displayName: 'a'.repeat(51) }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when displayName contains invalid characters', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', displayName: '<script>' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when displayName is a number', async () => {
    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', displayName: 12345 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('accepts valid displayName with spaces, hyphens, apostrophes', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'existinguser', displayName: 'O\'Brien-Smith' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  // F-001: DB query replaces listUsers
  it('returns 200 when username is unchanged (does not query DB)', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'existinguser', displayName: 'Test User' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // db.select should NOT be called when username unchanged
    expect(db.select).not.toHaveBeenCalled();
  });

  it('uses DB query (not listUsers) to check username uniqueness', async () => {
    mockLimit.mockResolvedValue([]);
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newusername', displayName: 'Test User' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(db.select).toHaveBeenCalled();
  });

  it('returns 409 when username is taken by another user', async () => {
    mockLimit.mockResolvedValue([
      { userId: 'other-user-id', username: 'newusername' },
    ]);

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newusername', displayName: 'Test User' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it('allows username if taken by the same user', async () => {
    mockLimit.mockResolvedValue([
      { userId: 'test-user-id', username: 'newusername' },
    ]);
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newusername', displayName: 'Test User' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it('returns 200 on successful profile update', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'existinguser', displayName: 'New Display Name' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('calls updateUser with correct data on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'existinguser', displayName: 'Updated Name' }),
    });

    await POST(request);

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: {
        username: 'existinguser',
        display_name: 'Updated Name',
      },
    });
  });

  it('returns 500 when DB query fails', async () => {
    mockLimit.mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newusername', displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('returns 500 when updateUser fails', async () => {
    mockUpdateUser.mockResolvedValue({
      error: new Error('Update failed'),
    });

    const request = new Request('http://localhost/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'existinguser', displayName: 'Test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
