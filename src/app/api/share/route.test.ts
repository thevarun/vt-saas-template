import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

// Mock dependencies
vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {},
}));

vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
}));

const { createClient } = await import('@/libs/supabase/server');
const { cookies } = await import('next/headers');

describe('POST /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: 'report',
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 400 if validation fails', async () => {
    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
        }),
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: '',
        resourceId: 'invalid-uuid',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should create share link successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockLink = {
      id: 'link-123',
      token: 'test-token-123',
      resourceType: 'report',
      resourceId: '123e4567-e89b-12d3-a456-426614174000',
      createdBy: mockUser.id,
      expiresAt: null,
      accessCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as any);

    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockLink]),
      }),
    });

    const { db } = await import('@/libs/DB');
    vi.mocked(db as any).insert = mockInsert;

    const request = new NextRequest('http://localhost:3000/api/share', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: 'report',
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);

    const data = await response.json();

    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('url');
    expect(data.url).toContain('/share/');
  });
});

describe('GET /api/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('should return user share links successfully', async () => {
    const mockUser = { id: 'user-123' };
    const mockLinks = [
      {
        id: 'link-1',
        token: 'token-1',
        resourceType: 'report',
        resourceId: '123e4567-e89b-12d3-a456-426614174000',
        createdBy: mockUser.id,
        expiresAt: null,
        accessCount: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'link-2',
        token: 'token-2',
        resourceType: 'document',
        resourceId: '223e4567-e89b-12d3-a456-426614174001',
        createdBy: mockUser.id,
        expiresAt: new Date('2024-12-31'),
        accessCount: 2,
        isActive: false,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as any);

    const mockOrderBy = vi.fn().mockResolvedValue(mockLinks);
    const mockWhere = vi.fn().mockReturnValue({
      orderBy: mockOrderBy,
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    });

    const { db } = await import('@/libs/DB');
    vi.mocked(db as any).select = mockSelect;

    const response = await GET();

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty('token', 'token-1');
    expect(data[1]).toHaveProperty('token', 'token-2');
  });

  it('should return empty array if user has no links', async () => {
    const mockUser = { id: 'user-123' };

    vi.mocked(cookies).mockResolvedValue({} as any);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as any);

    const mockOrderBy = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({
      orderBy: mockOrderBy,
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    });

    const { db } = await import('@/libs/DB');
    vi.mocked(db as any).select = mockSelect;

    const response = await GET();

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toEqual([]);
  });
});
