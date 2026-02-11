import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  dbError,
  internalError,
  logApiError,
  logDbError,
  unauthorizedError,
} from '@/libs/api/errors';
import { listUserConversations } from '@/libs/queries/vercelConversations';
import { createClient } from '@/libs/supabase/server';

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
export async function GET(request: NextRequest): Promise<Response> {
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

    // Extract and validate pagination query params
    const url = new URL(request.url);
    const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);

    // Query conversations - RLS automatically filters by user_id
    const { data: conversations, error: dbQueryError } = await listUserConversations(
      supabase,
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

    // For total count, fetch all conversations (needed for pagination UI)
    const { data: allConversations, error: countError } = await listUserConversations(
      supabase,
      user.id,
      false,
    );

    if (countError) {
      logDbError('count conversations', countError, {
        endpoint: '/api/chat/vercel/conversations',
        method: 'GET',
        userId: user.id,
      });
      // Continue with paginated results, just return count of paginated data
    }

    return NextResponse.json({
      conversations: conversations ?? [],
      total: allConversations?.length ?? conversations?.length ?? 0,
    });
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/chat/vercel/conversations',
      method: 'GET',
    });
    return internalError();
  }
}
