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
import { CONVERSATION_ID_PATTERN } from '@/libs/validations/chat';

/**
 * GET /api/chat/messages
 * Fetches conversation message history from Dify
 * Requires authentication and conversationId query parameter
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

    // Get conversationId from query params (accept legacy snake_case for backward compat)
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId')
      || searchParams.get('conversation_id');

    if (!conversationId) {
      return invalidRequestError('conversationId is required');
    }

    if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
      return invalidRequestError('Conversation ID must be alphanumeric with hyphens, max 128 characters');
    }

    // Fetch message history from Dify
    // User ID must match the user who created the conversation
    const difyClient = createDifyClient();
    const response = await difyClient.getMessages(conversationId, user.id);

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown> | null;
    const errMessage = error instanceof Error ? error.message : (typeof errObj?.message === 'string' ? errObj.message : String(error));
    const errStatus = typeof errObj?.status === 'number' ? errObj.status : undefined;

    logApiError(error, {
      endpoint: '/api/chat/messages',
      method: 'GET',
      errorCode: errStatus ? 'DIFY_ERROR' : 'INTERNAL_ERROR',
    });

    // Handle Dify-specific errors
    if (errStatus) {
      return difyError(errMessage || 'Failed to fetch messages');
    }

    return internalError();
  }
}
