import type { User } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAllUsers,
  getActiveUsersCount,
  getActiveUsersCountWithTrend,
  getNewSignupsCount,
  getNewSignupsCountWithTrend,
  getPendingFeedbackCount,
  getTotalUsersCount,
} from '../metrics';

// Mock the admin client
vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

// Import the mocked module
const { createAdminClient } = await import('@/libs/supabase/admin');
const mockedCreateAdminClient = vi.mocked(createAdminClient);

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    last_sign_in_at: null,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    ...overrides,
  } as User;
}

function createMockAdminClient(users: User[]) {
  return {
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: { users },
          error: null,
        }),
      },
    },
  };
}

/**
 * Creates a mock admin client that simulates pagination.
 * Returns `usersPerPage` users for the first `fullPages` calls,
 * then returns `remainingUsers` users on the last call.
 */
function createPaginatedMockAdminClient(
  fullPages: number,
  usersPerPage: number,
  remainingUsers: User[],
  allPageUsers?: User[],
) {
  let callCount = 0;
  return {
    auth: {
      admin: {
        listUsers: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= fullPages) {
            // Return a full page of users
            const pageUsers = allPageUsers
              ? allPageUsers.slice((callCount - 1) * usersPerPage, callCount * usersPerPage)
              : Array.from({ length: usersPerPage }, () => createMockUser());
            return Promise.resolve({
              data: { users: pageUsers },
              error: null,
            });
          }
          // Return the remaining users (last page)
          return Promise.resolve({
            data: { users: remainingUsers },
            error: null,
          });
        }),
      },
    },
  };
}

describe('metrics queries', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('fetchAllUsers', () => {
    it('fetches single page when fewer than 1000 users', async () => {
      const users = [createMockUser(), createMockUser(), createMockUser()];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await fetchAllUsers();

      expect(result).toHaveLength(3);
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledTimes(1);
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 1000,
      });
    });

    it('paginates through multiple pages when 1000+ users exist', async () => {
      const remainingUsers = Array.from({ length: 50 }, () => createMockUser());
      const mockClient = createPaginatedMockAdminClient(2, 1000, remainingUsers);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await fetchAllUsers();

      // 2 full pages of 1000 + 50 remaining = 2050
      expect(result).toHaveLength(2050);
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledTimes(3);
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledWith({ page: 2, perPage: 1000 });
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledWith({ page: 3, perPage: 1000 });
    });

    it('handles exactly 1000 users (needs 2 API calls)', async () => {
      const mockClient = createPaginatedMockAdminClient(1, 1000, []);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await fetchAllUsers();

      // 1 full page of 1000 + empty last page
      expect(result).toHaveLength(1000);
      expect(mockClient.auth.admin.listUsers).toHaveBeenCalledTimes(2);
    });

    it('throws on API error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      await expect(fetchAllUsers()).rejects.toThrow('Database error');
    });
  });

  describe('getTotalUsersCount', () => {
    it('returns total user count', async () => {
      const users = [createMockUser(), createMockUser(), createMockUser()];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getTotalUsersCount();

      expect(count).toBe(3);
    });

    it('returns 0 when no users exist', async () => {
      const mockClient = createMockAdminClient([]);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getTotalUsersCount();

      expect(count).toBe(0);
    });

    it('returns null on error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getTotalUsersCount();

      expect(count).toBeNull();
    });

    it('counts all users across multiple pages', async () => {
      const remainingUsers = Array.from({ length: 500 }, () => createMockUser());
      const mockClient = createPaginatedMockAdminClient(1, 1000, remainingUsers);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getTotalUsersCount();

      expect(count).toBe(1500);
    });
  });

  describe('getNewSignupsCount', () => {
    it('returns count of users created in last 7 days', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const users = [
        createMockUser({ created_at: threeDaysAgo.toISOString() }),
        createMockUser({ created_at: now.toISOString() }),
        createMockUser({ created_at: tenDaysAgo.toISOString() }),
      ];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getNewSignupsCount();

      expect(count).toBe(2);
    });

    it('returns null on error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getNewSignupsCount();

      expect(count).toBeNull();
    });
  });

  describe('getNewSignupsCountWithTrend', () => {
    it('calculates positive trend correctly', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      // 2 users in current week, 1 in previous week = +100%
      const users = [
        createMockUser({ created_at: threeDaysAgo.toISOString() }),
        createMockUser({ created_at: now.toISOString() }),
        createMockUser({ created_at: tenDaysAgo.toISOString() }),
      ];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await getNewSignupsCountWithTrend();

      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
      expect(result!.trend.direction).toBe('up');
      expect(result!.trend.isPositive).toBe(true);
      expect(result!.trend.percentage).toBe(100);
    });

    it('returns null on error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await getNewSignupsCountWithTrend();

      expect(result).toBeNull();
    });
  });

  describe('getActiveUsersCount', () => {
    it('returns count of users with recent sign-in', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const users = [
        createMockUser({ last_sign_in_at: threeDaysAgo.toISOString() }),
        createMockUser({ last_sign_in_at: now.toISOString() }),
        createMockUser({ last_sign_in_at: tenDaysAgo.toISOString() }),
        createMockUser({ last_sign_in_at: undefined }),
      ];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getActiveUsersCount();

      expect(count).toBe(2);
    });

    it('returns null on error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const count = await getActiveUsersCount();

      expect(count).toBeNull();
    });
  });

  describe('getActiveUsersCountWithTrend', () => {
    it('calculates trend for active users', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const users = [
        createMockUser({ last_sign_in_at: threeDaysAgo.toISOString() }),
        createMockUser({ last_sign_in_at: tenDaysAgo.toISOString() }),
      ];
      const mockClient = createMockAdminClient(users);
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await getActiveUsersCountWithTrend();

      expect(result).not.toBeNull();
      expect(result!.count).toBe(1);
      expect(result!.trend).toBeDefined();
    });

    it('returns null on error', async () => {
      const mockClient = {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          },
        },
      };
      mockedCreateAdminClient.mockReturnValue(mockClient as any);

      const result = await getActiveUsersCountWithTrend();

      expect(result).toBeNull();
    });
  });

  describe('getPendingFeedbackCount', () => {
    it('returns 0 (placeholder)', async () => {
      const count = await getPendingFeedbackCount();

      expect(count).toBe(0);
    });
  });
});
