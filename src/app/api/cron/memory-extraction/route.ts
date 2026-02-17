/**
 * Memory Extraction Cron Endpoint
 *
 * This endpoint is triggered by Vercel Cron to process memory extraction jobs.
 * It runs every 5 minutes to extract memories from completed conversations.
 *
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Only processes jobs when Mem0 is enabled
 * - Validates secret before processing
 *
 * Usage:
 * - Automatic: Configured in vercel.json to run every 5 minutes
 * - Manual: curl -X GET /api/cron/memory-extraction -H "Authorization: Bearer YOUR_SECRET"
 *
 * Response:
 * - 200: Jobs processed successfully
 * - 401: Unauthorized (missing or invalid secret)
 * - 500: Processing failed
 *
 * Related Files:
 * - vercel.json: Cron schedule configuration
 * - src/libs/mem0/worker.ts: Job processing logic
 *
 * @see {@link https://vercel.com/docs/cron-jobs Vercel Cron Documentation}
 */

import * as Sentry from '@sentry/nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { processMemoryExtractionJobs } from '@/libs/mem0/worker';

/**
 * GET /api/cron/memory-extraction
 *
 * Process pending memory extraction jobs.
 * Validates CRON_SECRET before processing.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Validate cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron endpoint not configured' },
        { status: 500 },
      );
    }

    if (authHeader !== expectedAuth) {
      logger.warn('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    Sentry.addBreadcrumb({
      category: 'cron',
      message: 'Memory extraction cron triggered',
    });

    logger.info('Processing memory extraction jobs');

    // Process jobs
    const stats = await processMemoryExtractionJobs();

    const duration = Date.now() - startTime;

    logger.info(
      {
        ...stats,
        durationMs: duration,
      },
      'Memory extraction cron completed',
    );

    return NextResponse.json({
      success: true,
      ...stats,
      durationMs: duration,
    });
  } catch (error: any) {
    Sentry.captureException(error);
    logger.error({ error }, 'Memory extraction cron failed');

    return NextResponse.json(
      { error: 'Job processing failed' },
      { status: 500 },
    );
  }
}
