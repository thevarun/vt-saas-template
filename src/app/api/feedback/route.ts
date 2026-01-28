import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  formatZodErrors,
  internalError,
  logApiError,
  logDbError,
  logValidationError,
  validationError,
} from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { createClient } from '@/libs/supabase/server';
import { feedback } from '@/models/Schema';

// Zod validation schema for feedback submission
const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'praise'], {
    errorMap: () => ({ message: 'Type must be bug, feature, or praise' }),
  }),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be 1000 characters or less'),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
});

type FeedbackInput = z.infer<typeof feedbackSchema>;

/**
 * POST /api/feedback
 *
 * Submit user feedback (bug reports, feature requests, or praise).
 * Supports both authenticated and anonymous submissions.
 *
 * Request Body:
 * - type: 'bug' | 'feature' | 'praise' (required)
 * - message: string (required, max 1000 chars)
 * - email: string (optional, only for anonymous users)
 *
 * Response (201):
 * - data: { id, type, message, status, createdAt }
 *
 * Errors:
 * - 400: Validation error (invalid input)
 * - 500: Database or internal error
 */
export async function POST(request: Request) {
  try {
    // Check authentication (optional - anonymous submissions allowed)
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    // Parse and validate request body
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      logValidationError(errors, {
        endpoint: '/api/feedback',
        method: 'POST',
        userId: user?.id,
      });
      return validationError(errors);
    }

    const validated: FeedbackInput = result.data;

    // Prepare database insert data
    // - Authenticated users: attach userId, ignore email
    // - Anonymous users: store email (if provided), userId is null
    const insertData = {
      type: validated.type,
      message: validated.message,
      userId: user?.id ?? null,
      userEmail: user ? null : (validated.email || null),
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
        userId: user?.id,
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
}
