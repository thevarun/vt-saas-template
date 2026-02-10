/**
 * Database query helpers for Vercel AI SDK conversations
 *
 * All queries use Supabase client with RLS (Row Level Security) enabled.
 * Users can only access their own conversations.
 */

import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { vercelConversations } from '@/models/Schema';

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
 * RLS ensures only the owner can access their conversations.
 *
 * @param _supabase Supabase client with user context
 * @param conversationId Conversation UUID
 * @returns Conversation data or null if not found
 */
export async function getConversationById(
  _supabase: SupabaseClient,
  conversationId: string,
): Promise<{ data: VercelConversation | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Fetching conversation by ID',
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
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, conversationId }, 'Failed to fetch conversation by ID');
    return {
      data: null,
      error,
    };
  }
}

/**
 * Create a new conversation
 *
 * RLS ensures the userId matches the authenticated user.
 *
 * @param _supabase Supabase client with user context
 * @param userId User ID who owns the conversation
 * @param title Conversation title
 * @returns Created conversation data or error
 */
export async function createConversation(
  _supabase: SupabaseClient,
  userId: string,
  title: string,
): Promise<{ data: VercelConversation | null; error: any }> {
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
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, userId, title }, 'Failed to create conversation');
    return {
      data: null,
      error,
    };
  }
}

/**
 * Update a conversation's metadata
 *
 * Updates the updatedAt timestamp automatically.
 * RLS ensures only the owner can update their conversations.
 *
 * @param _supabase Supabase client with user context
 * @param conversationId Conversation UUID
 * @param updates Fields to update
 * @returns Updated conversation data or error
 */
export async function updateConversation(
  _supabase: SupabaseClient,
  conversationId: string,
  updates: ConversationUpdate,
): Promise<{ data: VercelConversation | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Updating conversation',
      data: { conversationId, updates },
    });

    const updateData: any = {
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
      .where(eq(vercelConversations.id, conversationId))
      .returning();

    logger.info({ conversationId }, 'Conversation updated');

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, conversationId, updates }, 'Failed to update conversation');
    return {
      data: null,
      error,
    };
  }
}

/**
 * List user's conversations
 *
 * Sorted by most recent activity first (updatedAt DESC).
 * RLS ensures users only see their own conversations.
 *
 * @param _supabase Supabase client with user context
 * @param userId User ID
 * @param includeArchived Whether to include archived conversations (default: false)
 * @returns List of conversations or error
 */
export async function listUserConversations(
  _supabase: SupabaseClient,
  userId: string,
  includeArchived: boolean = false,
): Promise<{ data: VercelConversation[] | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-conversation',
      message: 'Listing user conversations',
      data: { userId, includeArchived },
    });

    const query = db
      .select()
      .from(vercelConversations)
      .where(
        includeArchived
          ? eq(vercelConversations.userId, userId)
          : and(eq(vercelConversations.userId, userId), eq(vercelConversations.archived, false)),
      )
      .orderBy(desc(vercelConversations.updatedAt));

    const result = await query;

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, userId, includeArchived }, 'Failed to list user conversations');
    return {
      data: null,
      error,
    };
  }
}
