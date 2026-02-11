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
import {
  deleteConversation,
  getConversationById,
  updateConversation,
} from '@/libs/queries/vercelConversations';
import { getConversationMessages } from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';

// Zod schema for PATCH /api/chat/vercel/conversations/[id] request validation
const updateConversationSchema = z.object({
  title: z.string().optional(),
});

/**
 * GET /api/chat/vercel/conversations/[id]
 * Returns conversation with all messages
 *
 * Acceptance Criteria:
 * - AC #2: Returns conversation with messages sorted by createdAt ASC
 * - AC #5: Returns 404 for conversations not owned by user (not 403)
 * - AC #7: Returns 401 for unauthenticated requests
 */
export async function GET(
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

    // Get conversation ID from params
    const { id } = await params;

    // Fetch conversation - RLS ensures user ownership
    const { data: conversation, error: dbQueryError } = await getConversationById(supabase, id);

    // Return 404 if conversation not found or not owned by user
    // (Security through obscurity - don't reveal existence)
    if (dbQueryError || !conversation) {
      if (!conversation) {
        return notFoundError('Conversation');
      }

      logDbError('fetch conversation', dbQueryError, {
        endpoint: `/api/chat/vercel/conversations/${id}`,
        method: 'GET',
        userId: user.id,
        metadata: { conversationId: id },
      });
      return dbError('Failed to fetch conversation');
    }

    // Fetch messages for the conversation
    const { data: messages, error: messagesError } = await getConversationMessages(supabase, id);

    if (messagesError) {
      logDbError('fetch conversation messages', messagesError, {
        endpoint: `/api/chat/vercel/conversations/${id}`,
        method: 'GET',
        userId: user.id,
        metadata: { conversationId: id },
      });
      return dbError('Failed to fetch messages');
    }

    return NextResponse.json({
      conversation,
      messages: messages ?? [],
    });
  } catch (error: any) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/chat/vercel/conversations/${id}`,
      method: 'GET',
      metadata: { conversationId: id },
    });
    return internalError();
  }
}

/**
 * PATCH /api/chat/vercel/conversations/[id]
 * Updates conversation title
 *
 * Acceptance Criteria:
 * - AC #3: Updates title and returns updated conversation
 * - AC #5: Returns 404 for conversations not owned by user (not 403)
 * - AC #7: Returns 401 for unauthenticated requests
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
    const validationResult = updateConversationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error);
      return validationError(errors);
    }

    const { title } = validationResult.data;

    // Get conversation ID from params
    const { id } = await params;

    // Update conversation - RLS ensures user ownership
    const { data: updatedConversation, error: dbUpdateError } = await updateConversation(
      supabase,
      id,
      { title },
    );

    // Return 404 if conversation not found or not owned by user
    // (Security through obscurity - don't reveal existence)
    if (dbUpdateError || !updatedConversation) {
      if (!updatedConversation) {
        return notFoundError('Conversation');
      }

      logDbError('update conversation', dbUpdateError, {
        endpoint: `/api/chat/vercel/conversations/${id}`,
        method: 'PATCH',
        userId: user.id,
        metadata: { conversationId: id },
      });
      return dbError('Failed to update conversation');
    }

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error: any) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/chat/vercel/conversations/${id}`,
      method: 'PATCH',
      metadata: { conversationId: id },
    });
    return internalError();
  }
}

/**
 * DELETE /api/chat/vercel/conversations/[id]
 * Permanently removes a conversation and all its messages (cascade)
 *
 * Acceptance Criteria:
 * - AC #4: Deletes conversation and cascades to messages
 * - AC #5: Returns 404 for conversations not owned by user (not 403)
 * - AC #7: Returns 401 for unauthenticated requests
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

    // Get conversation ID from params
    const { id } = await params;

    // Delete conversation - RLS ensures user ownership
    // Messages are automatically deleted via cascade (schema: onDelete: 'cascade')
    const { data: deletedConversation, error: dbDeleteError } = await deleteConversation(
      supabase,
      id,
    );

    // Return 404 if conversation not found or not owned by user
    // (Security through obscurity - don't reveal existence)
    if (dbDeleteError || !deletedConversation) {
      if (!deletedConversation) {
        return notFoundError('Conversation');
      }

      logDbError('delete conversation', dbDeleteError, {
        endpoint: `/api/chat/vercel/conversations/${id}`,
        method: 'DELETE',
        userId: user.id,
        metadata: { conversationId: id },
      });
      return dbError('Failed to delete conversation');
    }

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: any) {
    const { id } = await params;
    logApiError(error, {
      endpoint: `/api/chat/vercel/conversations/${id}`,
      method: 'DELETE',
      metadata: { conversationId: id },
    });
    return internalError();
  }
}
