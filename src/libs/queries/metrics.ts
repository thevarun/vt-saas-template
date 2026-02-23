import type { User } from '@supabase/supabase-js';
import { count, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { createAdminClient } from '@/libs/supabase/admin';
import type { TrendData } from '@/libs/utils/calculateTrend';
import { calculateTrend } from '@/libs/utils/calculateTrend';
import { feedback } from '@/models/Schema';

export type MetricWithTrend = {
  count: number;
  trend: TrendData;
};

const USERS_PER_PAGE = 1000;

/**
 * Fetches all users from Supabase Admin API, paginating through all pages.
 * The API returns at most 1000 users per page, so we loop until we receive
 * fewer users than the page size, which indicates we've reached the last page.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const supabaseAdmin = createAdminClient();
  const allUsers: User[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw error;
    }

    allUsers.push(...data.users);
    hasMore = data.users.length === USERS_PER_PAGE;
    page++;
  }

  return allUsers;
}

/**
 * Returns the total number of registered users.
 * Uses Supabase Admin API to list all users and count them.
 */
export async function getTotalUsersCount(): Promise<number | null> {
  try {
    const users = await fetchAllUsers();
    return users.length;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch total users count');
    return null;
  }
}

/**
 * Returns the count of users who signed up in the last 7 days.
 */
export async function getNewSignupsCount(): Promise<number | null> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await fetchAllUsers();

    const count = users.filter(
      user => new Date(user.created_at) >= sevenDaysAgo,
    ).length;

    return count;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch new signups count');
    return null;
  }
}

/**
 * Returns the count of users who signed up in the last 7 days,
 * along with trend data comparing to the previous 7-day period.
 */
export async function getNewSignupsCountWithTrend(): Promise<MetricWithTrend | null> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await fetchAllUsers();

    const currentCount = users.filter(
      user => new Date(user.created_at) >= sevenDaysAgo,
    ).length;

    const previousCount = users.filter((user) => {
      const createdAt = new Date(user.created_at);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    }).length;

    return {
      count: currentCount,
      trend: calculateTrend(currentCount, previousCount),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch new signups with trend');
    return null;
  }
}

/**
 * Returns the count of users who logged in within the last 7 days.
 */
export async function getActiveUsersCount(): Promise<number | null> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await fetchAllUsers();

    const count = users.filter(
      user => user.last_sign_in_at && new Date(user.last_sign_in_at) >= sevenDaysAgo,
    ).length;

    return count;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch active users count');
    return null;
  }
}

/**
 * Returns the count of active users in the last 7 days,
 * along with trend data comparing to the previous 7-day period.
 */
export async function getActiveUsersCountWithTrend(): Promise<MetricWithTrend | null> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await fetchAllUsers();

    const currentCount = users.filter(
      user => user.last_sign_in_at && new Date(user.last_sign_in_at) >= sevenDaysAgo,
    ).length;

    const previousCount = users.filter((user) => {
      if (!user.last_sign_in_at) {
        return false;
      }
      const lastSignIn = new Date(user.last_sign_in_at);
      return lastSignIn >= fourteenDaysAgo && lastSignIn < sevenDaysAgo;
    }).length;

    return {
      count: currentCount,
      trend: calculateTrend(currentCount, previousCount),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch active users with trend');
    return null;
  }
}

/**
 * Returns the count of pending (unreviewed) feedback from the database.
 */
export async function getPendingFeedbackCount(): Promise<number | null> {
  try {
    const result = await db
      .select({ count: count() })
      .from(feedback)
      .where(eq(feedback.status, 'pending'));

    return result[0]?.count ?? 0;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch pending feedback count');
    return null;
  }
}
