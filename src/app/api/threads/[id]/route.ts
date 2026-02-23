import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  dbError,
  formatZodErrors,
  internalError,
  logApiError,
  logDbError,
  notFoundError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { deleteThread, updateThread } from '@/libs/queries/threads';
import { createClient } from '@/libs/supabase/server';

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
      return unauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateThreadSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      return validationError(errors);
    }

    const { title, lastMessagePreview } = validationResult.data;

    // Get thread ID from params
    const { id } = await params;

    // Update thread record - userId WHERE filter enforces ownership
    const { data: updatedThread, error: dbUpdateError } = await updateThread(
      id,
      {
        title,
        lastMessagePreview,
      },
      user.id,
    );

    // Return 404 if thread not found or not owned by user
    if (dbUpdateError || !updatedThread) {
      // PGRST116 = no rows returned (not found or RLS blocked)
      const errorCode = dbUpdateError && 'code' in dbUpdateError ? (dbUpdateError as { code: string }).code : undefined;
      if (errorCode === 'PGRST116' || !updatedThread) {
        return notFoundError('Thread');
      }

      logDbError('update thread', dbUpdateError, {
        endpoint: `/api/threads/${id}`,
        method: 'PATCH',
        userId: user.id,
        metadata: { threadId: id },
      });
      return dbError('Failed to update thread');
    }

    return NextResponse.json({ thread: updatedThread });
  } catch (error: unknown) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/threads/${id}`,
      method: 'PATCH',
      metadata: { threadId: id },
    });
    return internalError();
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
      return unauthorizedError();
    }

    // Get thread ID from params
    const { id } = await params;

    // Delete thread - userId WHERE filter enforces ownership
    const { data: deletedThread, error: dbDeleteError } = await deleteThread(
      id,
      user.id,
    );

    // Return 404 if thread not found or not owned by user
    if (dbDeleteError || !deletedThread) {
      // PGRST116 = no rows returned (not found or RLS blocked)
      const errorCode = dbDeleteError && 'code' in dbDeleteError ? (dbDeleteError as { code: string }).code : undefined;
      if (errorCode === 'PGRST116' || !deletedThread) {
        return notFoundError('Thread');
      }

      logDbError('delete thread', dbDeleteError, {
        endpoint: `/api/threads/${id}`,
        method: 'DELETE',
        userId: user.id,
        metadata: { threadId: id },
      });
      return dbError('Failed to delete thread');
    }

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/threads/${id}`,
      method: 'DELETE',
      metadata: { threadId: id },
    });
    return internalError();
  }
}
