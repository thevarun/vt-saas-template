import { NextResponse } from 'next/server';

import {
  dbError,
  internalError,
  logApiError,
  logDbError,
  notFoundError,
} from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { getThreadById, updateThread } from '@/libs/queries/threads';

/**
 * PATCH /api/threads/[id]/archive
 * Toggles the archived status of a thread
 *
 * Acceptance Criteria:
 * - AC #8: Toggles archive status
 * - AC #10: Returns 401 for unauthenticated requests
 */
export const PATCH = withAuth(async (_request, { user, params }) => {
  const id = params?.id;
  try {
    // First, fetch the current thread to get its archived status
    // userId WHERE filter enforces ownership
    const { data: currentThread, error: fetchError } = await getThreadById(
      id,
      user.id,
    );

    if (fetchError || !currentThread) {
      return notFoundError('Thread');
    }

    // Toggle the archived status - userId WHERE filter enforces ownership
    const { data: updatedThread, error: updateError } = await updateThread(
      id,
      { archived: !currentThread.archived },
      user.id,
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
    logApiError(error, {
      endpoint: `/api/threads/${id}/archive`,
      method: 'PATCH',
      metadata: { threadId: id },
    });
    return internalError();
  }
});
