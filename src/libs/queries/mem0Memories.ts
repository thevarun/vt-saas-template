/**
 * Database query helpers for Mem0 memories
 *
 * Memories are extracted facts, preferences, and context from conversations.
 * They enable personalized AI responses across sessions.
 *
 * Memory Types:
 * - fact: Factual information about the user (e.g., "lives in Paris")
 * - preference: User preferences (e.g., "prefers dark mode")
 * - context: Conversational context (e.g., "working on a project")
 *
 * @see {@link https://mem0.ai/docs Mem0 Documentation}
 */

import * as Sentry from '@sentry/nextjs';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { mem0Memories } from '@/models/Schema';

/**
 * Memory data type from database
 */
export type Memory = {
  id: string;
  userId: string;
  conversationId: string | null;
  memoryText: string;
  memoryType: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Batch-insert multiple memories in a single DB round-trip
 *
 * @param rows Array of memory values to insert
 * @returns Created memories or error
 */
export async function createMemories(
  rows: {
    userId: string;
    conversationId: string;
    memoryText: string;
    memoryType?: string | null;
    metadata?: any;
  }[],
): Promise<{ data: Memory[]; error: any }> {
  if (rows.length === 0) {
    return { data: [], error: null };
  }

  try {
    Sentry.addBreadcrumb({
      category: 'mem0-memory',
      message: `Batch creating ${rows.length} memories`,
      data: { count: rows.length, userId: rows[0]?.userId },
    });

    const values = rows.map(r => ({
      userId: r.userId,
      conversationId: r.conversationId,
      memoryText: r.memoryText,
      memoryType: r.memoryType ?? null,
      metadata: r.metadata ?? null,
    }));

    const result = await db
      .insert(mem0Memories)
      .values(values)
      .returning();

    logger.info(
      { count: result.length, userId: rows[0]?.userId },
      'Batch memories created',
    );

    return { data: result, error: null };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error(
      { error, count: rows.length },
      'Failed to batch create memories',
    );
    return { data: [], error };
  }
}

/**
 * Create a new memory
 *
 * Stores an extracted memory from Mem0 API.
 *
 * @param userId User UUID
 * @param conversationId Conversation UUID
 * @param memoryText Memory text content
 * @param memoryType Optional type (fact, preference, context)
 * @param metadata Optional metadata from Mem0
 * @returns Created memory data or error
 */
export async function createMemory(
  userId: string,
  conversationId: string,
  memoryText: string,
  memoryType?: string,
  metadata?: any,
): Promise<{ data: Memory | null; error: any }> {
  try {
    Sentry.addBreadcrumb({
      category: 'mem0-memory',
      message: 'Creating memory',
      data: {
        userId,
        conversationId,
        memoryType,
        textLength: memoryText.length,
      },
    });

    const result = await db
      .insert(mem0Memories)
      .values({
        userId,
        conversationId,
        memoryText,
        memoryType: memoryType ?? null,
        metadata: metadata ?? null,
      })
      .returning();

    logger.info(
      {
        memoryId: result[0]?.id,
        userId,
        conversationId,
        memoryType,
      },
      'Memory created',
    );

    return {
      data: result[0] || null,
      error: null,
    };
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error(
      { error, userId, conversationId },
      'Failed to create memory',
    );
    return {
      data: null,
      error,
    };
  }
}

/**
 * Get memories for a user
 *
 * Retrieves all memories associated with a user.
 * Orders by creation time (newest first).
 *
 * @param userId User UUID
 * @param limit Maximum number of memories to return (default: 50)
 * @returns Array of memories
 */
export async function getMemoriesByUserId(
  userId: string,
  limit: number = 50,
): Promise<Memory[]> {
  try {
    const memories = await db
      .select()
      .from(mem0Memories)
      .where(eq(mem0Memories.userId, userId))
      .orderBy(desc(mem0Memories.createdAt))
      .limit(limit);

    return memories;
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, userId }, 'Failed to fetch user memories');
    return [];
  }
}

/**
 * Get memories for a conversation
 *
 * Retrieves all memories extracted from a specific conversation.
 *
 * @param conversationId Conversation UUID
 * @returns Array of memories
 */
export async function getMemoriesByConversation(
  conversationId: string,
): Promise<Memory[]> {
  try {
    const memories = await db
      .select()
      .from(mem0Memories)
      .where(eq(mem0Memories.conversationId, conversationId))
      .orderBy(desc(mem0Memories.createdAt));

    return memories;
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error, conversationId }, 'Failed to fetch conversation memories');
    return [];
  }
}
