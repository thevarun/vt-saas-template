/** @module Memory retrieval -- fetches relevant memories via Mem0 for chat context injection. */

import { logger } from '@/libs/Logger';

import { getMem0Client } from './client';
import { isEnabled } from './config';

/** Get relevant memories for a user via semantic search. Returns empty array if disabled or on error. */
export async function getRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5,
): Promise<string[]> {
  if (!isEnabled()) {
    return [];
  }

  const client = getMem0Client();
  if (!client) {
    return [];
  }

  try {
    const results = await client.search(query, {
      user_id: userId,
      limit,
    });

    if (!results || !Array.isArray(results)) {
      return [];
    }

    const memories = results
      .map((result: any) => {
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
    return [];
  }
}

/** Format memories as a system prompt section. Returns empty string if no memories. */
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
