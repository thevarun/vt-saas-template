/** @module Memory extraction job queue -- fire-and-forget queueing for async cron processing. */

import { logger } from '@/libs/Logger';
import { createMemoryJob } from '@/libs/queries/memoryJobs';

import { isEnabled } from './config';

/** Queue a memory extraction job. Returns immediately if Mem0 is disabled; never throws. */
export async function queueMemoryExtraction(
  conversationId: string,
): Promise<void> {
  if (!isEnabled()) {
    return;
  }

  try {
    const { error } = await createMemoryJob(conversationId);

    if (error) {
      logger.error(
        { error, conversationId },
        'Failed to queue memory extraction job',
      );
      return;
    }

    logger.info({ conversationId }, 'Memory extraction job queued');
  } catch (error) {
    logger.error(
      { error, conversationId },
      'Unexpected error queueing memory job',
    );
  }
}
