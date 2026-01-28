import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';

import { PATCH } from './route';

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

describe('PATCH /api/profile/update-preferences', () => {
  const mockCookieStore = {} as any;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  it('returns 401 when user is not authenticated', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    const request = new Request('http://localhost/api/profile/update-preferences', {
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
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const request = new Request('http://localhost/api/profile/update-preferences', {
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
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const request = new Request('http://localhost/api/profile/update-preferences', {
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

  it('creates new preferences for new user', async () => {
    const mockInsertedProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: 'testuser',
      emailNotifications: true,
      language: 'en',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    // Mock select returning empty (new user)
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Mock insert
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockInsertedProfile]),
      }),
    });

    (db.select as any) = mockSelect;
    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/update-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailNotifications: true,
        language: 'en',
        username: 'testuser',
        isNewUser: true,
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      emailNotifications: true,
      language: 'en',
      username: 'testuser',
    });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('updates existing preferences for existing user', async () => {
    const existingProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: 'existinguser',
      emailNotifications: false,
      language: 'hi',
    };

    const mockUpdatedProfile = {
      ...existingProfile,
      emailNotifications: true,
      language: 'en',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    // Mock select returning existing user
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingProfile]),
        }),
      }),
    });

    // Mock update
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
        }),
      }),
    });

    (db.select as any) = mockSelect;
    (db.update as any) = mockUpdate;

    const request = new Request('http://localhost/api/profile/update-preferences', {
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
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      emailNotifications: true,
      language: 'en',
      username: 'existinguser',
    });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('accepts all valid language options', async () => {
    const languages = ['en', 'hi', 'bn'];

    for (const language of languages) {
      vi.clearAllMocks();

      const existingProfile = {
        id: 'profile-id',
        userId: mockUser.id,
        username: 'testuser',
        emailNotifications: true,
        language: 'en',
      };

      const mockUpdatedProfile = {
        ...existingProfile,
        language,
      };

      (createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existingProfile]),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
          }),
        }),
      });

      (db.select as any) = mockSelect;
      (db.update as any) = mockUpdate;

      const request = new Request('http://localhost/api/profile/update-preferences', {
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
      expect(data.data.language).toBe(language);
    }
  });

  it('returns 500 when database save fails', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    // Mock select returning empty (new user)
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Mock insert returning empty (failed)
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    (db.select as any) = mockSelect;
    (db.insert as any) = mockInsert;

    const request = new Request('http://localhost/api/profile/update-preferences', {
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
