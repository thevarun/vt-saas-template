/** @module Memory extraction worker -- processes pending jobs via Mem0 API, triggered by cron. */

import * as Sentry from '@sentry/nextjs';

import { logger } from '@/libs/Logger';
import { createMemories } from '@/libs/queries/mem0Memories';
import {
  getPendingJobs,
  updateJobStatus,
} from '@/libs/queries/memoryJobs';
import { getConversationByIdAdmin } from '@/libs/queries/vercelConversations';
import { getConversationMessages } from '@/libs/queries/vercelMessages';

import { getMem0Client } from './client';
import { isEnabled } from './config';

/** Process all pending memory extraction jobs. Returns stats on processed/succeeded/failed. */
export async function processMemoryExtractionJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (!isEnabled()) {
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
      await updateJobStatus(job.id, 'processing');

      Sentry.addBreadcrumb({
        category: 'memory-job',
        message: 'Processing job',
        data: {
          jobId: job.id,
          conversationId: job.conversationId,
        },
      });

      const { data: messages, error: fetchError } = await getConversationMessages(
        job.conversationId,
      );

      if (fetchError || !messages || messages.length === 0) {
        throw new Error(
          `Failed to fetch messages: ${fetchError?.message || 'No messages found'}`,
        );
      }

      const { data: conversation } = await getConversationByIdAdmin(
        job.conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const userId = conversation.userId;

      const formattedMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

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

      if (memories && Array.isArray(memories)) {
        const memoryRows = memories
          .map((memoryData) => {
            const memoryText = memoryData.memory
              || memoryData.data?.memory
              || '';
            if (!memoryText) {
              return null;
            }
            return {
              userId,
              conversationId: job.conversationId,
              memoryText,
              memoryType: memoryData.memory_type || null,
              metadata: memoryData.metadata || null,
            };
          })
          .filter(Boolean) as {
          userId: string;
          conversationId: string;
          memoryText: string;
          memoryType: string | null;
          metadata: any;
        }[];

        if (memoryRows.length > 0) {
          await createMemories(memoryRows);
        }
      }

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

      const errorMessage = error.message || 'Unknown error';
      await updateJobStatus(job.id, 'failed', errorMessage);
    }
  }

  logger.info(
    { processed, succeeded, failed },
    'Memory extraction jobs processing completed',
  );

  return { processed, succeeded, failed };
}
