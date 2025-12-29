import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/libs/Logger';
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
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Query threads table - RLS automatically filters by user_id
    const { data: userThreads, error: dbError } = await getThreads(supabase);

    if (dbError) {
      logger.error({ error: dbError }, 'Failed to fetch threads');
      return NextResponse.json(
        { error: 'Failed to fetch threads', code: 'DB_ERROR' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      threads: userThreads ?? [],
      count: userThreads?.length ?? 0,
    });
  } catch (error: any) {
    logger.error({ error }, 'GET /api/threads error');

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
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
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createThreadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { conversationId, title } = validationResult.data;

    // Insert thread record - RLS ensures user_id matches auth.uid()
    const { data: newThread, error: dbError } = await createThread(
      supabase,
      user.id,
      {
        conversation_id: conversationId,
        title: title || null,
      },
    );

    if (dbError) {
      // Handle duplicate conversation_id error
      if (dbError.message?.includes('duplicate') || dbError.message?.includes('unique')) {
        return NextResponse.json(
          {
            error: 'Thread with this conversation ID already exists',
            code: 'DUPLICATE_CONVERSATION_ID',
          },
          { status: 409 },
        );
      }

      logger.error({ error: dbError }, 'Failed to create thread');
      return NextResponse.json(
        { error: 'Failed to create thread', code: 'DB_ERROR' },
        { status: 500 },
      );
    }

    // Return created thread with 201 status
    return NextResponse.json(
      { thread: newThread },
      { status: 201 },
    );
  } catch (error: any) {
    logger.error({ error }, 'POST /api/threads error');

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
