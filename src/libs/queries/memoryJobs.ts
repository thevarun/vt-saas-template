/**
 * Database query helpers for memory extraction jobs
 *
 * Memory extraction jobs are queued after conversations complete
 * and processed asynchronously by a cron worker.
 *
 * Job States:
 * - pending: Job queued, awaiting processing
 * - processing: Worker is actively processing the job
 * - completed: Job finished successfully
 * - failed: Job failed (error message in errorMessage field)
 *
 * @see {@link /api/cron/memory-extraction Cron endpoint}
 */

import * as Sentry from '@sentry/nextjs';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { memoryExtractionJobs } from '@/models/Schema';

import type { DbQueryError, MemoryJobStatus } from './types';
import { toDbQueryError } from './types';

/**
 * Memory extraction job data type
 */
export type MemoryJob = {
  id: string;
  conversationId: string;
  status: MemoryJobStatus;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

/**
 * Create a new memory extraction job
 *
 * Queues a job for async processing by the cron worker.
 * Sets initial status to 'pending'.
 *
 * @param conversationId Conversation UUID
 * @returns Created job data or error
 */
export async function createMemoryJob(
  conversationId: string,
): Promise<{ data: MemoryJob | null; error: DbQueryError | null }> {
  try {
    Sentry.addBreadcrumb({
      category: 'memory-job',
      message: 'Creating memory extraction job',
      data: {
        conversationId,
      },
    });

    const result = await db
      .insert(memoryExtractionJobs)
      .values({
        conversationId,
        status: 'pending',
      })
      .returning();

    logger.info(
      {
        jobId: result[0]?.id,
        conversationId,
      },
      'Memory extraction job created',
    );

    const row = result[0];
    return {
      data: row ? { ...row, status: row.status as MemoryJobStatus } : null,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error(
      { error, conversationId },
      'Failed to create memory extraction job',
    );
    return {
      data: null,
      error: dbError,
    };
  }
}

/**
 * Get pending jobs ready for processing
 *
 * Retrieves jobs with status='pending' for the cron worker.
 * Orders by creation time (oldest first).
 *
 * @param limit Maximum number of jobs to return (default: 100)
 * @returns Array of pending jobs
 */
export async function getPendingJobs(limit: number = 100): Promise<MemoryJob[]> {
  try {
    const jobs = await db
      .select()
      .from(memoryExtractionJobs)
      .where(eq(memoryExtractionJobs.status, 'pending'))
      .orderBy(memoryExtractionJobs.createdAt)
      .limit(limit);

    return jobs.map(job => ({ ...job, status: job.status as MemoryJobStatus }));
  } catch (error: unknown) {
    Sentry.captureException(error);
    logger.error({ error }, 'Failed to fetch pending jobs');
    return [];
  }
}

/**
 * Get job by ID
 *
 * @param jobId Job UUID
 * @returns Job data or null if not found
 */
export async function getJobById(
  jobId: string,
): Promise<MemoryJob | null> {
  try {
    const result = await db
      .select()
      .from(memoryExtractionJobs)
      .where(eq(memoryExtractionJobs.id, jobId))
      .limit(1);

    const row = result[0];
    return row ? { ...row, status: row.status as MemoryJobStatus } : null;
  } catch (error: unknown) {
    Sentry.captureException(error);
    logger.error({ error, jobId }, 'Failed to fetch job');
    return null;
  }
}

/**
 * Update job status
 *
 * Updates job status and optionally records error message and completion time.
 *
 * @param jobId Job UUID
 * @param status New status (pending, processing, completed, failed)
 * @param errorMessage Optional error message (for failed jobs)
 * @returns Success indicator
 */
export async function updateJobStatus(
  jobId: string,
  status: MemoryJobStatus,
  errorMessage?: string,
): Promise<{ success: boolean; error: DbQueryError | null }> {
  try {
    const updates: Partial<typeof memoryExtractionJobs.$inferInsert> & { status: MemoryJobStatus } = {
      status,
    };

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }

    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date();
    }

    await db
      .update(memoryExtractionJobs)
      .set(updates)
      .where(eq(memoryExtractionJobs.id, jobId));

    logger.info(
      {
        jobId,
        status,
        hasError: !!errorMessage,
      },
      'Job status updated',
    );

    return {
      success: true,
      error: null,
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    const dbError = toDbQueryError(error);
    logger.error({ error, jobId, status }, 'Failed to update job status');
    return {
      success: false,
      error: dbError,
    };
  }
}
