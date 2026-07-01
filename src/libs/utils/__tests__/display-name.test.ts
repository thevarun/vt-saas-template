import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { getDisplayName } from '../display-name';

function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    email: 'ada@example.com',
    user_metadata: {},
    app_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User;
}

describe('getDisplayName', () => {
  it('returns profile.displayName when present', () => {
    const user = mockUser();

    expect(getDisplayName(user, { displayName: 'From Profile' })).toBe('From Profile');
  });

  it('falls back to email prefix when profile name is missing', () => {
    const user = mockUser();

    expect(getDisplayName(user, { displayName: null })).toBe('ada');
    expect(getDisplayName(user, null)).toBe('ada');
    expect(getDisplayName(user)).toBe('ada');
  });

  it('returns empty string when user is null', () => {
    expect(getDisplayName(null)).toBe('');
    expect(getDisplayName(undefined)).toBe('');
  });

  it('returns empty string when user has no email and no profile', () => {
    const user = mockUser({ email: undefined });

    expect(getDisplayName(user)).toBe('');
  });

  it('ignores empty-string profile name and falls through to email prefix', () => {
    const user = mockUser();

    expect(getDisplayName(user, { displayName: '' })).toBe('ada');
  });

  it('does not read user_metadata.full_name', () => {
    const user = mockUser({ user_metadata: { full_name: 'From Metadata' } });

    expect(getDisplayName(user)).toBe('ada');
  });
});
