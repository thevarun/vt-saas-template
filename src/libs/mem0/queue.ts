/**
 * Memory Extraction Job Queue
 *
 * This module provides fire-and-forget job queueing for memory extraction.
 * Jobs are processed asynchronously by a cron worker.
 *
 * Flow:
 * 1. After conversation completes, queueMemoryExtraction is called
 * 2. Job record created with status='pending'
 * 3. Cron worker picks up pending jobs
 * 4. Worker extracts memories via Mem0 API
 * 5. Job status updated to 'completed' or 'failed'
 *
 * Non-Blocking Pattern:
 * - Queue operation never blocks chat response
 * - Errors are logged but don't throw
 * - Gracefully skips when Mem0 is disabled
 *
 * @see {@link /api/cron/memory-extraction Cron endpoint}
 */

import { logger } from '@/libs/Logger';
import { createMemoryJob } from '@/libs/queries/memoryJobs';

import { isMem0Enabled } from './client';

/**
 * Queue a memory extraction job for async processing
 *
 * This function is called after a conversation completes.
 * It creates a job record that will be processed by the cron worker.
 *
 * Graceful Degradation:
 * - Returns immediately if Mem0 is disabled
 * - Logs errors but never throws
 * - Does not block chat response
 *
 * @param conversationId Conversation UUID to extract memories from
 */
export async function queueMemoryExtraction(
  conversationId: string,
): Promise<void> {
  if (!isMem0Enabled()) {
    return; // Skip if disabled
  }

  try {
    const { error } = await createMemoryJob(conversationId);

    if (error) {
      logger.error(
        { error, conversationId },
        'Failed to queue memory extraction job',
      );
      // Don't throw - this should never block chat
      return;
    }

    logger.info({ conversationId }, 'Memory extraction job queued');
  } catch (error) {
    logger.error(
      { error, conversationId },
      'Unexpected error queueing memory job',
    );
    // Don't throw - this should never block chat
  }
}
