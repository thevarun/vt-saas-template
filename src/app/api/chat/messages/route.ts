import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  difyError,
  internalError,
  invalidRequestError,
  logApiError,
  unauthorizedError,
} from '@/libs/api/errors';
import { createDifyClient } from '@/libs/dify/client';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/chat/messages
 * Fetches conversation message history from Dify
 * Requires authentication and conversation_id query parameter
 */
export async function GET(request: Request) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Get conversation_id from query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return invalidRequestError('conversation_id is required');
    }

    // Fetch message history from Dify
    // User ID must match the user who created the conversation
    const difyClient = createDifyClient();
    const response = await difyClient.getMessages(conversationId, user.id);

    return NextResponse.json(response);
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/chat/messages',
      method: 'GET',
      errorCode: error.status ? 'DIFY_ERROR' : 'INTERNAL_ERROR',
    });

    // Handle Dify-specific errors
    if (error.status) {
      return difyError(error.message || 'Failed to fetch messages');
    }

    return internalError();
  }
}
