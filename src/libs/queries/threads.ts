/**
 * Database query helpers for Dify chat threads
 *
 * All queries use Drizzle ORM with explicit userId WHERE filters for ownership enforcement.
 * Supabase client is only used for authentication, never for data queries.
 */

import * as Sentry from '@sentry/nextjs';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { threads } from '@/models/Schema';

import type { DbQueryError } from './types';
import { toDbQueryError } from './types';

/**
 * Thread data type from database (camelCase, matching Drizzle column mapping)
 */
export type Thread = typeof threads.$inferSelect;

/**
 * Thread update parameters
 */
export type ThreadUpdate = {
  title?: string;
  lastMessagePreview?: string;
  archived?: boolean;
};

/**
 * Get all threads for a user, ordered by updatedAt DESC.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param userId User ID for ownership enforcement
 * @returns List of threads or error
 */
export async function getThreadsByUser(
  userId: string,
): Promise<{ data: Thread[] | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Listing user threads',
      data: { userId },
    });

    const result = await db
      .select()
      .from(threads)
      .where(eq(threads.userId, userId))
      .orderBy(desc(threads.updatedAt));

    return { data: result, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, userId }, 'Failed to list user threads');
    return { data: null, error: dbError };
  }
}

/**
 * Get a single thread by ID.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param threadId Thread UUID
 * @param userId User ID for ownership enforcement
 * @returns Thread data or null if not found
 */
export async function getThreadById(
  threadId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Fetching thread by ID',
      data: { threadId, userId },
    });

    const result = await db
      .select()
      .from(threads)
      .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
      .limit(1);

    return { data: result[0] || null, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, threadId }, 'Failed to fetch thread by ID');
    return { data: null, error: dbError };
  }
}

/**
 * Get a thread by conversation_id.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param conversationId Dify conversation ID
 * @param userId User ID for ownership enforcement
 * @returns Thread data or null if not found
 */
export async function getThreadByConversationId(
  conversationId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Fetching thread by conversation ID',
      data: { conversationId, userId },
    });

    const result = await db
      .select()
      .from(threads)
      .where(and(eq(threads.conversationId, conversationId), eq(threads.userId, userId)))
      .limit(1);

    return { data: result[0] || null, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, conversationId }, 'Failed to fetch thread by conversation ID');
    return { data: null, error: dbError };
  }
}

/**
 * Create a new thread.
 * Authorization: userId is set as the owner at creation time.
 *
 * @param userId User ID who owns the thread
 * @param input Thread creation parameters
 * @returns Created thread data or error
 */
export async function createThread(
  userId: string,
  input: { conversationId: string; title?: string | null; lastMessagePreview?: string | null },
): Promise<{ data: Thread | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Creating new thread',
      data: { userId, conversationId: input.conversationId },
    });

    const result = await db
      .insert(threads)
      .values({
        userId,
        conversationId: input.conversationId,
        title: input.title ?? null,
        lastMessagePreview: input.lastMessagePreview ?? null,
        archived: false,
      })
      .returning();

    logger.info({ threadId: result[0]?.id, userId }, 'Thread created');

    return { data: result[0] || null, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, userId }, 'Failed to create thread');
    return { data: null, error: dbError };
  }
}

/**
 * Update a thread by ID.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param threadId Thread UUID
 * @param updates Fields to update
 * @param userId User ID for ownership enforcement
 * @returns Updated thread data or error
 */
export async function updateThread(
  threadId: string,
  updates: ThreadUpdate,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Updating thread',
      data: { threadId, updates, userId },
    });

    const updateData: Partial<typeof threads.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.lastMessagePreview !== undefined) {
      updateData.lastMessagePreview = updates.lastMessagePreview;
    }
    if (updates.archived !== undefined) {
      updateData.archived = updates.archived;
    }

    const result = await db
      .update(threads)
      .set(updateData)
      .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
      .returning();

    logger.info({ threadId }, 'Thread updated');

    return { data: result[0] || null, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, threadId, updates }, 'Failed to update thread');
    return { data: null, error: dbError };
  }
}

/**
 * Delete a thread by ID.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param threadId Thread UUID
 * @param userId User ID for ownership enforcement
 * @returns Deleted thread data or null if not found
 */
export async function deleteThread(
  threadId: string,
  userId: string,
): Promise<{ data: Thread | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Deleting thread',
      data: { threadId, userId },
    });

    const result = await db
      .delete(threads)
      .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
      .returning();

    logger.info({ threadId }, 'Thread deleted');

    return { data: result[0] || null, error: null };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, threadId }, 'Failed to delete thread');
    return { data: null, error: dbError };
  }
}
