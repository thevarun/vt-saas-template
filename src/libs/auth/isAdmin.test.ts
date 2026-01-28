import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isAdmin } from './isAdmin';

describe('isAdmin', () => {
  // Save original env and restore after each test
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env for each test
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  describe('user_metadata.isAdmin flag (primary method)', () => {
    it('returns true when user has user_metadata.isAdmin = true', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { isAdmin: true },
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('returns false when user has user_metadata.isAdmin = false', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { isAdmin: false },
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('prioritizes user_metadata.isAdmin flag over ADMIN_EMAILS env var', () => {
      process.env.ADMIN_EMAILS = 'other@example.com';

      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { isAdmin: true },
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });
  });

  describe('ADMIN_EMAILS environment variable (fallback method)', () => {
    it('returns true when user email is in ADMIN_EMAILS', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,owner@example.com';

      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('returns true for second email in ADMIN_EMAILS list', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,owner@example.com';

      const user = {
        id: 'user-123',
        email: 'owner@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('is case-insensitive for email matching', () => {
      process.env.ADMIN_EMAILS = 'Admin@Example.com';

      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('handles case-insensitive matching when user email is uppercase', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const user = {
        id: 'user-123',
        email: 'ADMIN@EXAMPLE.COM',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('handles whitespace in ADMIN_EMAILS list', () => {
      process.env.ADMIN_EMAILS = ' admin@example.com , owner@example.com ';

      const user = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(true);
    });

    it('returns false when user email is not in ADMIN_EMAILS', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,owner@example.com';

      const user = {
        id: 'user-123',
        email: 'regular@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });
  });

  describe('non-admin user scenarios', () => {
    it('returns false for user without isAdmin flag and no ADMIN_EMAILS match', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('returns false when ADMIN_EMAILS is not set', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('handles missing user_metadata gracefully', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles user_metadata as undefined', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: undefined,
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles empty ADMIN_EMAILS string', () => {
      process.env.ADMIN_EMAILS = '';

      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles user without email', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const user = {
        id: 'user-123',
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles user with null email', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      const user = {
        id: 'user-123',
        email: null,
        user_metadata: {},
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles isAdmin as non-boolean truthy value (should be false)', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { isAdmin: 'true' },
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });

    it('handles isAdmin as number 1 (should be false)', () => {
      const user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { isAdmin: 1 },
      } as unknown as User;

      expect(isAdmin(user)).toBe(false);
    });
  });
});
