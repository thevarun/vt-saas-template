import type { User } from '@supabase/supabase-js';

import { createAdminClient } from '@/libs/supabase/admin';

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
 * This function requires the SUPABASE_SERVICE_ROLE_KEY to be configured.
 *
 * Note: Supabase Admin API pagination is 1-indexed
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
    const supabaseAdmin = createAdminClient();

    // Supabase Admin API uses 1-indexed pages
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (error) {
      throw error;
    }

    let filteredUsers = data.users || [];

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

    return {
      users: filteredUsers,
      total: data.users?.length || 0, // Note: Supabase doesn't provide total count directly
      error: null,
    };
  } catch (error) {
    console.error('Error fetching users list:', error);
    return {
      users: [],
      total: 0,
      error: error as Error,
    };
  }
}

/**
 * Determines the status of a user based on their Supabase auth data.
 *
 * Status logic:
 * - suspended: User has banned_until set (any date)
 * - pending: Email not confirmed (email_confirmed_at is null)
 * - active: All other cases
 */
export function getUserStatus(user: User): 'active' | 'suspended' | 'pending' {
  // Check for ban (suspended status)
  if (user.banned_until) {
    return 'suspended';
  }

  // Check for pending email verification
  if (!user.email_confirmed_at) {
    return 'pending';
  }

  // Default to active
  return 'active';
}

/**
 * Gets user initials from email and/or username.
 * Priority: username > email
 * Returns first 2 characters, uppercase.
 */
export function getUserInitials(email?: string | null, username?: string | null): string {
  if (username && username.length > 0) {
    return username.substring(0, 2).toUpperCase();
  }
  if (email && email.length > 0) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U?';
}
