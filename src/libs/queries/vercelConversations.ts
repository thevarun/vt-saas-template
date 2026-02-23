/**
 * Database query helpers for Vercel AI SDK conversations
 *
 * All queries use Drizzle ORM with explicit userId WHERE filters for ownership enforcement.
 * Supabase client is only used for authentication, never for data queries.
 */

import * as Sentry from '@sentry/nextjs';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { vercelConversations } from '@/models/Schema';

import type { DbQueryError } from './types';
import { toDbQueryError } from './types';

/**
 * Conversation data type from database
 */
export type VercelConversation = {
  id: string;
  userId: string;
  title: string | null;
  lastMessagePreview: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Conversation update parameters
 */
export type ConversationUpdate = {
  title?: string;
  lastMessagePreview?: string;
  archived?: boolean;
};

/**
 * Get a conversation by ID
 *
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param conversationId Conversation UUID
 * @param userId User ID for ownership enforcement
 * @returns Conversation data or null if not found
 */
export async function getConversationById(
  conversationId: string,
  userId: string,
): Promise<{ data: VercelConversation | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Fetching conversation by ID',
      data: { conversationId, userId },
    });

    const result = await db
      .select()
      .from(vercelConversations)
      .where(and(eq(vercelConversations.id, conversationId), eq(vercelConversations.userId, userId)))
      .limit(1);

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, conversationId }, 'Failed to fetch conversation by ID');
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * Get a conversation by ID without user ownership filter (admin/worker use only).
 *
 * WARNING: This bypasses user ownership checks. Only use in background workers
 * or admin contexts where the caller does not know the userId upfront.
 *
 * @param conversationId Conversation UUID
 * @returns Conversation data or null if not found
 */
export async function getConversationByIdAdmin(
  conversationId: string,
): Promise<{ data: VercelConversation | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Fetching conversation by ID (admin)',
      data: { conversationId },
    });

    const result = await db
      .select()
      .from(vercelConversations)
      .where(eq(vercelConversations.id, conversationId))
      .limit(1);

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, conversationId }, 'Failed to fetch conversation by ID (admin)');
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * Create a new conversation
 *
 * Authorization: userId is set as the owner at creation time.
 *
 * @param userId User ID who owns the conversation
 * @param title Conversation title
 * @returns Created conversation data or error
 */
export async function createConversation(
  userId: string,
  title: string,
): Promise<{ data: VercelConversation | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Creating new conversation',
      data: { userId, title },
    });

    const result = await db
      .insert(vercelConversations)
      .values({
        userId,
        title,
        lastMessagePreview: null,
        archived: false,
      })
      .returning();

    logger.info({ conversationId: result[0]?.id, userId }, 'Conversation created');

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, userId, title }, 'Failed to create conversation');
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * Update a conversation's metadata
 *
 * Updates the updatedAt timestamp automatically.
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param conversationId Conversation UUID
 * @param updates Fields to update
 * @param userId User ID for ownership enforcement
 * @returns Updated conversation data or error
 */
export async function updateConversation(
  conversationId: string,
  updates: ConversationUpdate,
  userId: string,
): Promise<{ data: VercelConversation | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Updating conversation',
      data: { conversationId, updates, userId },
    });

    const updateData: Partial<typeof vercelConversations.$inferInsert> & { updatedAt: Date } = {
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
      .update(vercelConversations)
      .set(updateData)
      .where(and(eq(vercelConversations.id, conversationId), eq(vercelConversations.userId, userId)))
      .returning();

    logger.info({ conversationId }, 'Conversation updated');

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, conversationId, updates }, 'Failed to update conversation');
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * List user's conversations with optional pagination
 *
 * Sorted by most recent activity first (updatedAt DESC).
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param userId User ID
 * @param includeArchived Whether to include archived conversations (default: false)
 * @param limit Maximum number of conversations to return (optional)
 * @param offset Number of conversations to skip (optional)
 * @returns List of conversations or error
 */
export async function listUserConversations(
  userId: string,
  includeArchived: boolean = false,
  limit?: number,
  offset?: number,
): Promise<{ data: VercelConversation[] | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Listing user conversations',
      data: { userId, includeArchived, limit, offset },
    });

    const baseQuery = db
      .select()
      .from(vercelConversations)
      .where(
        includeArchived
          ? eq(vercelConversations.userId, userId)
          : and(eq(vercelConversations.userId, userId), eq(vercelConversations.archived, false)),
      )
      .orderBy(desc(vercelConversations.updatedAt));

    // Apply pagination if provided
    const query = limit !== undefined
      ? (offset !== undefined ? baseQuery.limit(limit).offset(offset) : baseQuery.limit(limit))
      : baseQuery;

    const result = await query;

    return {
      data: result,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, userId, includeArchived, limit, offset }, 'Failed to list user conversations');
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * Delete a conversation by ID
 *
 * Messages are automatically deleted via cascade (defined in schema).
 * Authorization: userId WHERE filter enforces ownership at the query level.
 *
 * @param conversationId Conversation UUID
 * @param userId User ID for ownership enforcement
 * @returns Deleted conversation data or null if not found
 */
export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<{ data: VercelConversation | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Deleting conversation',
      data: { conversationId, userId },
    });

    const result = await db
      .delete(vercelConversations)
      .where(and(eq(vercelConversations.id, conversationId), eq(vercelConversations.userId, userId)))
      .returning();

    logger.info({ conversationId }, 'Conversation deleted (messages cascade deleted)');

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, conversationId }, 'Failed to delete conversation');
    return {
      data: null,
      error: dbError,
    };
  }
}
