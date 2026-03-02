import { cookies } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';

import { PATCH } from './route';

vi.mock('@/libs/Logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(),
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

    // Mock upsert chain: db.insert().values().onConflictDoUpdate().returning()
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockInsertedProfile]),
        }),
      }),
    });

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
    const mockUpdatedProfile = {
      id: 'profile-id',
      userId: mockUser.id,
      username: 'existinguser',
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

    // Mock upsert chain (onConflictDoUpdate handles existing user)
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
        }),
      }),
    });

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

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
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

      (createClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedProfile]),
          }),
        }),
      });

      (db.insert as any) = mockInsert;

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

    // Mock upsert returning empty (failed)
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

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
