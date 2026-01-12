import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  createErrorResponse,
  dbError,
  formatZodErrors,
  HTTP_STATUS,
  internalError,
  logApiError,
  logDbError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';
import { createThread, getThreads } from '@/libs/supabase/threads';

// Zod schema for POST /api/threads request validation
const createThreadSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  title: z.string().optional(),
});

/**
 * GET /api/threads
 * Returns authenticated user's threads ordered by updated_at DESC
 *
 * Acceptance Criteria:
 * - AC #5: Returns authenticated user's threads (ordered by updated_at DESC)
 * - AC #10: Returns 401 for unauthenticated requests
 */
export async function GET(): Promise<Response> {
  try {
    // Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Return 401 for unauthorized requests
    if (authError || !user) {
      return unauthorizedError();
    }

    // Query threads table - RLS automatically filters by user_id
    const { data: userThreads, error: dbQueryError } = await getThreads(supabase);

    if (dbQueryError) {
      logDbError('fetch threads', dbQueryError, {
        endpoint: '/api/threads',
        method: 'GET',
        userId: user.id,
      });
      return dbError('Failed to fetch threads');
    }

    return NextResponse.json({
      threads: userThreads ?? [],
      count: userThreads?.length ?? 0,
    });
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/threads',
      method: 'GET',
    });
    return internalError();
  }
}

/**
 * POST /api/threads
 * Creates a new thread with conversation_id
 *
 * Acceptance Criteria:
 * - AC #6: Creates thread with conversation_id
 * - AC #10: Returns 401 for unauthenticated requests
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Return 401 for unauthorized requests
    if (authError || !user) {
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createThreadSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      return validationError(errors);
    }

    const { conversationId, title } = validationResult.data;

    // Insert thread record - RLS ensures user_id matches auth.uid()
    const { data: newThread, error: dbInsertError } = await createThread(
      supabase,
      user.id,
      {
        conversation_id: conversationId,
        title: title || null,
      },
    );

    if (dbInsertError) {
      // Handle duplicate conversation_id error
      if (dbInsertError.message?.includes('duplicate') || dbInsertError.message?.includes('unique')) {
        return createErrorResponse(
          'Thread with this conversation ID already exists',
          'DUPLICATE_CONVERSATION_ID',
          HTTP_STATUS.CONFLICT,
        );
      }

      logDbError('create thread', dbInsertError, {
        endpoint: '/api/threads',
        method: 'POST',
        userId: user.id,
      });
      return dbError('Failed to create thread');
    }

    // Return created thread with 201 status
    return NextResponse.json(
      { thread: newThread },
      { status: 201 },
    );
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/threads',
      method: 'POST',
    });
    return internalError();
  }
}
