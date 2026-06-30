import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';

import { GET, PATCH } from './route';

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

function mockAuthedUser() {
  (createClient as any).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    },
  });
}

function mockUnauthed() {
  (createClient as any).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      }),
    },
  });
}

describe('GET /api/profile/preferences', () => {
  const mockCookieStore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockUnauthed();

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('returns existing preferences for the signed-in user', async () => {
    mockAuthedUser();

    const existingProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: 'existinguser',
      emailNotifications: false,
      language: 'hi',
    };

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingProfile]),
        }),
      }),
    });
    (db.select as any) = mockSelect;

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      emailNotifications: false,
      language: 'hi',
      username: 'existinguser',
    });
  });

  it('returns schema defaults (no insert) when no row exists', async () => {
    mockAuthedUser();

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    const mockInsert = vi.fn();
    (db.select as any) = mockSelect;
    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      emailNotifications: true,
      language: 'en',
      username: null,
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/profile/preferences', () => {
  const mockCookieStore = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockUnauthed();

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'en',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('returns 400 for invalid language value', async () => {
    mockAuthedUser();

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'invalid', // Invalid language
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid emailNotifications type', async () => {
    mockAuthedUser();

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: 'yes', // Should be boolean
        language: 'en',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('creates new preferences for new user via atomic upsert', async () => {
    const mockInsertedProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: null,
      emailNotifications: true,
      language: 'en',
    };

    mockAuthedUser();

    // Mock upsert chain: db.insert().values().onConflictDoUpdate().returning()
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockInsertedProfile]),
        }),
      }),
    });

    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'en',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      emailNotifications: true,
      language: 'en',
      username: null,
    });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('updates existing preferences via atomic upsert', async () => {
    const mockUpdatedProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: 'existinguser',
      emailNotifications: true,
      language: 'en',
    };

    mockAuthedUser();

    // onConflictDoUpdate handles the existing-row case in a single statement.
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
        }),
      }),
    });

    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'en',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      emailNotifications: true,
      language: 'en',
      username: 'existinguser',
    });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('accepts all valid language options', async () => {
    const languages = ['en', 'hi', 'bn'];

    for (const language of languages) {
      vi.clearAllMocks();

      const mockUpdatedProfile = {
        id: 'profile-id',
        userId: mockUser.id,
        username: 'testuser',
        emailNotifications: true,
        language,
      };

      mockAuthedUser();

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
          }),
        }),
      });

      (db.insert as any) = mockInsert;

      const request = new Request('http://localhost/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: true,
          language,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.language).toBe(language);
    }
  });

  it('returns 500 when database save fails', async () => {
    mockAuthedUser();

    // Mock upsert returning empty (failed)
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'en',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe('SAVE_FAILED');
  });
});
