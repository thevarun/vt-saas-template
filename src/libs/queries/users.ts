import type { User } from '@supabase/supabase-js';

import { logger } from '@/libs/Logger';

import { fetchAllUsers } from './metrics';
import { getUserStatus } from './userUtils';

export { getUserInitials, getUserStatus } from './userUtils';

export type UsersListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'created_at' | 'email';
  sortOrder?: 'asc' | 'desc';
  status?: 'all' | 'active' | 'suspended' | 'pending';
};

export type UsersListResult = {
  users: User[];
  total: number;
  error: Error | null;
};

/**
 * Fetches a list of users from Supabase auth.users table using the Admin API.
 * Fetches all users, then applies search/status/sort filters in-memory,
 * and returns the correct page slice with accurate total count.
 *
 * This approach is necessary because Supabase Admin API doesn't support
 * server-side search or filtering on listUsers.
 */
export async function getUsersList(options: UsersListOptions = {}): Promise<UsersListResult> {
  const {
    page = 1,
    limit = 20,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    status = 'all',
  } = options;

  try {
    const allUsers = await fetchAllUsers();
    let filteredUsers = allUsers;

    // Apply search filter (email or username)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => {
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const usernameMatch = user.user_metadata?.username?.toLowerCase().includes(searchLower);
        return emailMatch || usernameMatch;
      });
    }

    // Apply status filter
    if (status !== 'all') {
      filteredUsers = filteredUsers.filter((user) => {
        const userStatus = getUserStatus(user);
        return userStatus === status;
      });
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      if (sortBy === 'email') {
        const comparison = (a.email || '').localeCompare(b.email || '');
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        // Default: sort by created_at
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    // Paginate the filtered result
    const total = filteredUsers.length;
    const start = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(start, start + limit);

    return {
      users: paginatedUsers,
      total,
      error: null,
    };
  } catch (error) {
    logger.error({ error }, 'Error fetching users list');
    return {
      users: [],
      total: 0,
      error: error as Error,
    };
  }
}
