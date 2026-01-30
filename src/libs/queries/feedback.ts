import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

export type FeedbackType = 'bug' | 'feature' | 'praise';
export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export type FeedbackFilters = {
  type?: FeedbackType;
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
};

export type FeedbackEntry = {
  id: string;
  type: FeedbackType;
  message: string;
  email: string | null;
  status: FeedbackStatus;
  userId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

function buildWhereConditions(filters: FeedbackFilters) {
  const conditions = [];
  if (filters.type) {
    conditions.push(eq(feedback.type, filters.type));
  }
  if (filters.status) {
    conditions.push(eq(feedback.status, filters.status));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Fetches feedback entries with optional filtering and pagination.
 * Ordered by createdAt descending (newest first).
 */
export async function getFeedbackList(
  filters: FeedbackFilters = {},
): Promise<FeedbackEntry[] | null> {
  try {
    const { limit = 20, offset = 0 } = filters;

    const results = await db
      .select()
      .from(feedback)
      .where(buildWhereConditions(filters))
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    return results as FeedbackEntry[];
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return null;
  }
}

/**
 * Returns the total count of feedback entries matching the given filters.
 * Used for pagination calculations.
 */
export async function getFeedbackCount(
  filters: FeedbackFilters = {},
): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(feedback)
      .where(buildWhereConditions(filters));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to count feedback:', error);
    return 0;
  }
}
