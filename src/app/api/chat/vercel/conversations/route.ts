import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  dbError,
  internalError,
  logApiError,
  logDbError,
} from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { listUserConversations } from '@/libs/queries/vercelConversations';

/**
 * GET /api/chat/vercel/conversations
 * Returns authenticated user's conversations ordered by updatedAt DESC
 *
 * Query Parameters:
 * - limit: Maximum conversations to return (default: 50, max: 100)
 * - offset: Number of conversations to skip (default: 0)
 *
 * Acceptance Criteria:
 * - AC #1: Returns list of conversations sorted by updatedAt DESC
 * - AC #6: Supports pagination with limit/offset query params
 * - AC #7: Returns 401 for unauthenticated requests
 */
export const GET = withAuth(async (request: NextRequest, { user }): Promise<Response> => {
  try {
    // Extract and validate pagination query params
    const url = new URL(request.url);
    const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

    // Query conversations - RLS automatically filters by user_id
    const { data: conversations, error: dbQueryError } = await listUserConversations(
      user.id,
      false, // excludeArchived = false (show non-archived only)
      limit,
      offset,
    );

    if (dbQueryError) {
      logDbError('fetch conversations', dbQueryError, {
        endpoint: '/api/chat/vercel/conversations',
        method: 'GET',
        userId: user.id,
        metadata: { limit, offset },
      });
      return dbError('Failed to fetch conversations');
    }

    return NextResponse.json({
      conversations: conversations ?? [],
      total: conversations?.length ?? 0,
    });
  } catch (error: unknown) {
    logApiError(error, {
      endpoint: '/api/chat/vercel/conversations',
      method: 'GET',
    });
    return internalError();
  }
});
