import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  dbError,
  internalError,
  logApiError,
  logDbError,
  notFoundError,
  unauthorizedError,
} from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';
import { getThreadById, updateThread } from '@/libs/supabase/threads';

/**
 * PATCH /api/threads/[id]/archive
 * Toggles the archived status of a thread
 *
 * Acceptance Criteria:
 * - AC #8: Toggles archive status
 * - AC #10: Returns 401 for unauthenticated requests
 */
export async function PATCH(
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

    // First, fetch the current thread to get its archived status
    // RLS ensures only user's own thread is returned
    const { data: currentThread, error: fetchError } = await getThreadById(
      supabase,
      id,
    );

    if (fetchError || !currentThread) {
      return notFoundError('Thread');
    }

    // Toggle the archived status - RLS ensures user ownership
    const { data: updatedThread, error: updateError } = await updateThread(
      supabase,
      id,
      { archived: !currentThread.archived },
    );

    if (updateError || !updatedThread) {
      logDbError('toggle thread archive status', updateError, {
        endpoint: `/api/threads/${id}/archive`,
        method: 'PATCH',
        userId: user.id,
        metadata: { threadId: id },
      });
      return dbError('Failed to update thread');
    }

    return NextResponse.json({ thread: updatedThread });
  } catch (error: any) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/threads/${id}/archive`,
      method: 'PATCH',
      metadata: { threadId: id },
    });
    return internalError();
  }
}
