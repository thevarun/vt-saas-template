import { describe, expect, it, vi } from 'vitest';

import { POST } from './route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({})),
}));

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: new Error('Not authenticated'),
      })),
    },
  })),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    })),
  },
}));

describe('POST /api/profile/check-username', () => {
  it('returns 401 if user is not authenticated', async () => {
    const request = new Request('http://localhost:3000/api/profile/check-username', {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);

    const data = await response.json();

    expect(data.code).toBe('AUTH_REQUIRED');
  });
});
