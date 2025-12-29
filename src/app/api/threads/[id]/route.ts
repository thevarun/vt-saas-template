import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/supabase/server';
import { deleteThread, updateThread } from '@/libs/supabase/threads';

// Zod schema for PATCH /api/threads/[id] request validation
const updateThreadSchema = z.object({
  title: z.string().optional(),
  lastMessagePreview: z.string().optional(),
});

/**
 * PATCH /api/threads/[id]
 * Updates title and/or last_message_preview of a thread
 *
 * Acceptance Criteria:
 * - AC #7: Updates title and last_message_preview
 * - AC #10: Returns 401 for unauthenticated requests
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
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
    const validationResult = updateThreadSchema.safeParse(body);

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

    const { title, lastMessagePreview } = validationResult.data;

    // Get thread ID from params
    const { id } = await params;

    // Update thread record - RLS ensures user ownership
    const { data: updatedThread, error: dbError } = await updateThread(
      supabase,
      id,
      {
        title,
        last_message_preview: lastMessagePreview,
      },
    );

    // Return 404 if thread not found or not owned by user
    if (dbError || !updatedThread) {
      // PGRST116 = no rows returned (not found or RLS blocked)
      const errorCode = (dbError as any)?.code;
      if (errorCode === 'PGRST116' || !updatedThread) {
        return NextResponse.json(
          {
            error: 'Thread not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      logger.error({ error: dbError }, 'Failed to update thread');
      return NextResponse.json(
        { error: 'Failed to update thread', code: 'DB_ERROR' },
        { status: 500 },
      );
    }

    return NextResponse.json({ thread: updatedThread });
  } catch (error: any) {
    logger.error({ error }, 'PATCH /api/threads/[id] error');

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/threads/[id]
 * Permanently removes a thread
 *
 * Acceptance Criteria:
 * - AC #9: Removes thread permanently
 * - AC #10: Returns 401 for unauthenticated requests
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
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

    // Get thread ID from params
    const { id } = await params;

    // Delete thread - RLS ensures user ownership
    const { data: deletedThread, error: dbError } = await deleteThread(
      supabase,
      id,
    );

    // Return 404 if thread not found or not owned by user
    if (dbError || !deletedThread) {
      // PGRST116 = no rows returned (not found or RLS blocked)
      const errorCode = (dbError as any)?.code;
      if (errorCode === 'PGRST116' || !deletedThread) {
        return NextResponse.json(
          {
            error: 'Thread not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      logger.error({ error: dbError }, 'Failed to delete thread');
      return NextResponse.json(
        { error: 'Failed to delete thread', code: 'DB_ERROR' },
        { status: 500 },
      );
    }

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: any) {
    logger.error({ error }, 'DELETE /api/threads/[id] error');

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
