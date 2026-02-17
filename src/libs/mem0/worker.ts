/**
 * Memory Extraction Worker
 *
 * This module processes pending memory extraction jobs.
 * It's triggered by a cron endpoint that runs every 5 minutes.
 *
 * Processing Flow:
 * 1. Fetch pending jobs from database
 * 2. For each job:
 *    a. Update status to 'processing'
 *    b. Fetch conversation messages
 *    c. Extract memories via Mem0 API
 *    d. Store memories in database
 *    e. Update job status to 'completed' or 'failed'
 * 3. Errors are isolated per job (don't stop processing)
 *
 * Error Handling:
 * - Transient errors: Job stays in 'failed' state (manual retry needed)
 * - Permanent errors: Job marked 'failed' with error message
 * - Processing continues for remaining jobs on failure
 *
 * @see {@link /api/cron/memory-extraction Cron endpoint}
 */

import * as Sentry from '@sentry/nextjs';

import { logger } from '@/libs/Logger';
import { createMemory } from '@/libs/queries/mem0Memories';
import {
  getPendingJobs,
  updateJobStatus,
} from '@/libs/queries/memoryJobs';
import { getConversationMessages } from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';

import { getMem0Client, isMem0Enabled } from './client';

/**
 * Process all pending memory extraction jobs
 *
 * This function is called by the cron endpoint.
 * It processes jobs in batches and handles errors gracefully.
 *
 * Graceful Degradation:
 * - Returns immediately if Mem0 is disabled
 * - Logs errors but doesn't throw
 * - Continues processing on job failure
 *
 * @returns Object with job processing stats
 */
export async function processMemoryExtractionJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (!isMem0Enabled()) {
    logger.info('Mem0 disabled - skipping job processing');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const client = getMem0Client();
  if (!client) {
    logger.warn('Mem0 client not available');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const jobs = await getPendingJobs();
  logger.info({ jobCount: jobs.length }, 'Processing memory extraction jobs');

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    processed++;

    try {
      // Update status to 'processing'
      await updateJobStatus(job.id, 'processing');

      Sentry.addBreadcrumb({
        category: 'memory-job',
        message: 'Processing job',
        data: {
          jobId: job.id,
          conversationId: job.conversationId,
        },
      });

      // Fetch conversation messages
      // Note: We need a Supabase client but don't have user context in cron
      // For now, we'll use the service role client from cookies (server context)
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      const { data: messages, error: fetchError } = await getConversationMessages(
        supabase,
        job.conversationId,
      );

      if (fetchError || !messages || messages.length === 0) {
        throw new Error(
          `Failed to fetch messages: ${fetchError?.message || 'No messages found'}`,
        );
      }

      // Get the first message to extract userId
      // Note: All messages in a conversation should have the same userId
      // We need to get it from the conversation record instead
      const conversationQuery = await import('@/libs/queries/vercelConversations');
      const { data: conversation } = await conversationQuery.getConversationById(
        supabase,
        job.conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const userId = conversation.userId;

      // Format messages for Mem0 API
      // Cast to proper type expected by Mem0 API
      const formattedMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Extract memories via Mem0 API
      // The add() method automatically extracts and stores memories
      // Returns an array of Memory objects directly
      const memories = await client.add(formattedMessages, {
        user_id: userId,
        metadata: {
          conversationId: job.conversationId,
          extractedAt: new Date().toISOString(),
        },
      });

      logger.info(
        {
          jobId: job.id,
          conversationId: job.conversationId,
          userId,
          memoriesExtracted: memories?.length || 0,
        },
        'Memories extracted via Mem0 API',
      );

      // Store memories in database
      // The result is an array of Memory objects
      if (memories && Array.isArray(memories)) {
        for (const memoryData of memories) {
          // Extract memory text from Mem0 response
          // The memory text can be in 'memory' field or nested in 'data.memory'
          const memoryText = memoryData.memory
            || memoryData.data?.memory
            || '';

          if (memoryText) {
            await createMemory(
              userId,
              job.conversationId,
              memoryText,
              memoryData.memory_type || undefined,
              memoryData.metadata || null,
            );
          }
        }
      }

      // Update job status to 'completed'
      await updateJobStatus(job.id, 'completed');
      succeeded++;

      logger.info(
        { jobId: job.id, memoriesCount: memories?.length || 0 },
        'Job completed successfully',
      );
    } catch (error: any) {
      failed++;

      Sentry.captureException(error);
      logger.error({ error, jobId: job.id }, 'Job failed');

      // Update job status to 'failed' with error message
      const errorMessage = error.message || 'Unknown error';
      await updateJobStatus(job.id, 'failed', errorMessage);

      // Continue processing other jobs (don't throw)
    }
  }

  logger.info(
    { processed, succeeded, failed },
    'Memory extraction jobs processing completed',
  );

  return { processed, succeeded, failed };
}
