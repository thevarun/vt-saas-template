import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  formatZodErrors,
  internalError,
  logApiError,
  logDbError,
  logValidationError,
  rateLimitError,
  validationError,
} from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { checkRateLimit } from '@/libs/api/rateLimit';
import { db } from '@/libs/DB';
import { feedback } from '@/models/Schema';

// Zod validation schema for feedback submission
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'praise'], {
    error: 'Type must be bug, feature, or praise',
  }),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(1000, 'Message must be 1000 characters or less'),
});

/**
 * POST /api/feedback
 *
 * Submit user feedback (bug reports, feature requests, or praise).
 * Requires authentication.
 *
 * Request Body:
 * - type: 'bug' | 'feature' | 'praise' (required)
 * - message: string (required, max 1000 chars)
 *
 * Response (201):
 * - data: { id, type, message, status, createdAt }
 *
 * Errors:
 * - 400: Validation error (invalid input)
 * - 401: User not authenticated
 * - 429: Rate limit exceeded
 * - 500: Database or internal error
 */
export const POST = withAuth(async (_request, { user }) => {
  try {
    // Rate limit: 5 submissions per hour per user
    const { allowed, retryAfterSeconds } = checkRateLimit(
      `feedback:${user.id}`,
      5,
      60 * 60 * 1000, // 1 hour
    );

    if (!allowed) {
      return rateLimitError(
        'Too many feedback submissions. Please try again later.',
        retryAfterSeconds,
      );
    }

    // Parse and validate request body
    const body = await _request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      logValidationError(errors, {
        endpoint: '/api/feedback',
        method: 'POST',
        userId: user.id,
      });
      return validationError(errors);
    }

    const validated = result.data;

    // Prepare database insert data
    const insertData = {
      type: validated.type,
      message: validated.message,
      userId: user.id,
      userEmail: null,
      status: 'pending' as const,
    };

    // Insert feedback into database
    let created;
    try {
      const results = await db.insert(feedback).values(insertData).returning();
      created = results[0];

      if (!created) {
        throw new Error('Insert failed - no record returned');
      }
    } catch (dbError) {
      logDbError('insert feedback', dbError, {
        endpoint: '/api/feedback',
        method: 'POST',
        userId: user.id,
      });
      return internalError('Failed to save feedback');
    }

    // Return success response (201 Created)
    // Do NOT include userId or userEmail for privacy
    return NextResponse.json(
      {
        data: {
          id: created.id,
          type: created.type,
          message: created.message,
          status: created.status,
          createdAt: created.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Handle unexpected errors
    logApiError(error, {
      endpoint: '/api/feedback',
      method: 'POST',
    });
    return internalError();
  }
});
