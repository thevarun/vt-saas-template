/**
 * Database query helpers for Vercel AI SDK messages
 *
 * All queries use Supabase client with RLS (Row Level Security) enabled.
 * Messages belong to conversations, which belong to users.
 */

import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import type { MessageMetadata, MessageRole } from '@/libs/vercel-ai/types';
import { vercelMessages } from '@/models/Schema';

/**
 * Message data type from database
 */
export type VercelMessage = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  tokenCount: number | null;
  latencyMs: number | null;
  createdAt: Date;
};

/**
 * Create a new message
 *
 * Stores user or assistant messages with optional metadata.
 *
 * @param _supabase Supabase client with user context
 * @param conversationId Conversation UUID
 * @param role Message role (user, assistant, system)
 * @param content Message text
 * @param metadata Optional token count and latency data
 * @returns Created message data or error
 */
export async function createMessage(
  _supabase: SupabaseClient,
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: MessageMetadata,
): Promise<{ data: VercelMessage | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-message',
      message: 'Creating message',
      data: {
        conversationId,
        role,
        contentLength: content.length,
        hasMetadata: !!metadata,
      },
    });

    const result = await db
      .insert(vercelMessages)
      .values({
        conversationId,
        role,
        content,
        tokenCount: metadata?.tokenCount ?? null,
        latencyMs: metadata?.latencyMs ?? null,
      })
      .returning();

    logger.info(
      {
        messageId: result[0]?.id,
        conversationId,
        role,
        tokenCount: metadata?.tokenCount,
        latencyMs: metadata?.latencyMs,
      },
      'Message created',
    );

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error(
      { error, conversationId, role },
      'Failed to create message',
    );
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get conversation messages
 *
 * Retrieves messages in chronological order (oldest first).
 * RLS ensures users can only access messages from their own conversations.
 *
 * @param _supabase Supabase client with user context
 * @param conversationId Conversation UUID
 * @param limit Maximum number of messages to return (default: 100)
 * @returns List of messages or error
 */
export async function getConversationMessages(
  _supabase: SupabaseClient,
  conversationId: string,
  limit: number = 100,
): Promise<{ data: VercelMessage[] | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-message',
      message: 'Fetching conversation messages',
      data: { conversationId, limit },
    });

    const result = await db
      .select()
      .from(vercelMessages)
      .where(eq(vercelMessages.conversationId, conversationId))
      .orderBy(asc(vercelMessages.createdAt))
      .limit(limit);

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error(
      { error, conversationId, limit },
      'Failed to fetch conversation messages',
    );
    return {
      data: null,
      error,
    };
  }
}

/**
 * Update message metadata
 *
 * Allows updating token counts and latency after message creation.
 * Useful for streaming scenarios where metadata is available after completion.
 *
 * @param _supabase Supabase client with user context
 * @param messageId Message UUID
 * @param metadata Token count and/or latency data
 * @returns Updated message data or error
 */
export async function updateMessageMetadata(
  _supabase: SupabaseClient,
  messageId: string,
  metadata: MessageMetadata,
): Promise<{ data: VercelMessage | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'vercel-message',
      message: 'Updating message metadata',
      data: { messageId, metadata },
    });

    const updateData: any = {};

    if (metadata.tokenCount !== undefined) {
      updateData.tokenCount = metadata.tokenCount;
    }
    if (metadata.latencyMs !== undefined) {
      updateData.latencyMs = metadata.latencyMs;
    }

    const result = await db
      .update(vercelMessages)
      .set(updateData)
      .where(eq(vercelMessages.id, messageId))
      .returning();

    logger.info({ messageId, metadata }, 'Message metadata updated');

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error(
      { error, messageId, metadata },
      'Failed to update message metadata',
    );
    return {
      data: null,
      error,
    };
  }
}
