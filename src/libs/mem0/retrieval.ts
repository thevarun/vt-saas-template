/**
 * Memory Retrieval
 *
 * This module fetches relevant memories for use in chat context.
 * Memories are retrieved before each chat request to personalize responses.
 *
 * Retrieval Strategy:
 * - Semantic search via Mem0 API (finds relevant memories based on query)
 * - Limit to 5 most relevant memories (configurable)
 * - Fallback to empty array on error (graceful degradation)
 *
 * Memory Injection:
 * - Memories are prepended to system prompt
 * - Format: Bullet list with context instruction
 * - AI uses memories to personalize responses
 *
 * Performance:
 * - Retrieval happens before each request (~100-200ms)
 * - Optional: Add caching layer for frequently accessed memories
 * - Gracefully returns empty array if disabled or on error
 *
 * @see {@link /api/chat/vercel Chat API integration}
 */

import { logger } from '@/libs/Logger';

import { getMem0Client, isMem0Enabled } from './client';

/**
 * Get relevant memories for a user
 *
 * Uses Mem0's semantic search to find memories relevant to the query.
 * Returns empty array if Mem0 is disabled or on error.
 *
 * Graceful Degradation:
 * - Returns [] if Mem0 is disabled
 * - Returns [] if search fails
 * - Never throws errors
 *
 * @param userId User UUID
 * @param query Search query (typically the user's message)
 * @param limit Maximum number of memories to return (default: 5)
 * @returns Array of memory texts
 */
export async function getRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5,
): Promise<string[]> {
  if (!isMem0Enabled()) {
    return [];
  }

  const client = getMem0Client();
  if (!client) {
    return [];
  }

  try {
    // Search for relevant memories using Mem0 API
    const results = await client.search(query, {
      user_id: userId,
      limit,
    });

    // Extract memory texts from results
    if (!results || !Array.isArray(results)) {
      return [];
    }

    const memories = results
      .map((result: any) => {
        // Handle different response formats from Mem0 API
        if (typeof result === 'string') {
          return result;
        }
        return result.memory || result.text || result.content || null;
      })
      .filter((memory): memory is string => !!memory);

    logger.info(
      {
        userId,
        queryLength: query.length,
        memoriesFound: memories.length,
      },
      'Retrieved relevant memories',
    );

    return memories;
  } catch (error) {
    logger.error(
      { error, userId },
      'Failed to retrieve memories',
    );
    // Return empty array on error (graceful degradation)
    return [];
  }
}

/**
 * Format memories for system prompt injection
 *
 * Converts memory array into a formatted string for the system prompt.
 *
 * @param memories Array of memory texts
 * @returns Formatted prompt section or empty string if no memories
 */
export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) {
    return '';
  }

  const memoriesSection = memories
    .map(memory => `- ${memory}`)
    .join('\n');

  return `You have the following memories about this user:
${memoriesSection}

Use these memories to personalize your responses and provide continuity across conversations.`;
}
