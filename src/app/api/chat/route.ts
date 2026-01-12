import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  difyError,
  internalError,
  invalidRequestError,
  logApiError,
  unauthorizedError,
} from '@/libs/api/errors';
import { createDifyClient } from '@/libs/dify/client';
import type { DifyChatRequest } from '@/libs/dify/types';
import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/supabase/server';
import {
  createThread,
  getThreadByConversationId,
  updateThread,
} from '@/libs/supabase/threads';

/**
 * Parse SSE event data from chunk
 */
function parseSSEEvent(chunk: string): Record<string, any> | null {
  try {
    // SSE format: "data: {json}\n\n"
    const dataMatch = chunk.match(/data: (.+)/);
    if (!dataMatch?.[1]) {
      return null;
    }

    const jsonStr = dataMatch[1].trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Create or update thread after receiving Dify response
 * AC #2: Thread auto-created in database after first Dify response
 * AC #3: Thread creation happens asynchronously (doesn't block chat response)
 * AC #4: Thread updated_at timestamp updates on new messages
 * AC #5: last_message_preview stores first 100 characters of last message
 * AC #6: Duplicate conversation_id handled gracefully
 *
 * Uses Supabase client for RLS enforcement - user can only access their own threads
 */
async function createOrUpdateThread(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  messageText: string,
): Promise<void> {
  try {
    Sentry.addBreadcrumb({
      category: 'thread',
      message: 'Creating or updating thread',
      data: { conversationId, userId },
    });

    // Check if thread already exists - RLS ensures only user's own thread is returned
    const { data: existingThread, error: fetchError } = await getThreadByConversationId(
      supabase,
      conversationId,
    );

    if (fetchError) {
      logger.warn({ error: fetchError, conversationId }, 'Error checking existing thread');
    }

    if (existingThread) {
      // AC #4 & #5: Update existing thread metadata
      const lastMessagePreview = messageText.slice(0, 100);

      const { error: updateError } = await updateThread(
        supabase,
        existingThread.id,
        { last_message_preview: lastMessagePreview },
      );

      if (updateError) {
        throw updateError;
      }

      Sentry.addBreadcrumb({
        category: 'thread',
        message: 'Thread updated',
        data: { threadId: existingThread.id, conversationId },
      });

      logger.info({ threadId: existingThread.id, conversationId }, 'Thread metadata updated');
    } else {
      // AC #2: Create new thread - RLS ensures user_id matches auth.uid()
      const title = messageText.slice(0, 50) || 'New Conversation';
      const lastMessagePreview = messageText.slice(0, 100);

      const { data: newThread, error: createError } = await createThread(
        supabase,
        userId,
        {
          conversation_id: conversationId,
          title,
          last_message_preview: lastMessagePreview,
        },
      );

      if (createError) {
        throw createError;
      }

      if (newThread) {
        Sentry.addBreadcrumb({
          category: 'thread',
          message: 'Thread created',
          data: { threadId: newThread.id, conversationId },
        });

        logger.info({ threadId: newThread.id, conversationId }, 'Thread created successfully');
      }
    }
  } catch (error: any) {
    // AC #3: Errors don't block chat response
    Sentry.addBreadcrumb({
      category: 'thread',
      level: 'error',
      message: 'Thread creation/update failed',
      data: { error: error.message, conversationId },
    });

    Sentry.captureException(error);
    logger.error({ error, conversationId }, 'Thread persistence failed');
    // Don't throw - chat already succeeded
  }
}

/**
 * POST /api/chat
 * Chat endpoint that validates Supabase session and proxies to Dify API
 *
 * Acceptance Criteria:
 * - AC #1: Validates Supabase session before proxying requests
 * - AC #2: Unauthorized requests return 401 with appropriate error message
 * - AC #3: Valid requests successfully proxy to Dify API
 * - AC #4: Streaming responses (SSE) work correctly from Dify through proxy to client
 * - AC #5: Dify API errors are caught and returned as appropriate HTTP responses
 * - AC #6: Dify API key is never exposed to client-side code (handled by server-side only)
 *
 * Story 3.2 - Thread Persistence:
 * - AC #1: Captures conversation_id from Dify SSE stream metadata
 * - AC #2-6: Auto-creates/updates threads (see createOrUpdateThread function)
 * - AC #8: Sentry breadcrumbs added for thread creation debugging
 *
 * Rate Limiting Considerations (Future Work):
 * - Implement rate limiting per user (e.g., 60 requests/minute) using Upstash Redis or similar
 * - Consider implementing exponential backoff for Dify API errors
 * - Add request queuing during peak load to prevent overwhelming Dify API
 * - Monitor Dify API usage to stay within plan limits (track via middleware or separate service)
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // AC #1: Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // AC #2: Return 401 for unauthorized requests
    if (authError || !user) {
      return unauthorizedError();
    }

    // Extract message and conversationId from request body
    const body = await request.json();
    const { message, conversationId } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return invalidRequestError('Message is required');
    }

    // Validate message size (max 10,000 characters)
    if (message.length > 10000) {
      return invalidRequestError('Message exceeds maximum length of 10,000 characters');
    }

    // Validate conversation ID format if provided
    if (conversationId !== undefined && conversationId !== null) {
      if (typeof conversationId !== 'string') {
        return invalidRequestError('Conversation ID must be a string');
      }

      // Validate format: alphanumeric + hyphens, max 128 chars
      const conversationIdPattern = /^[a-z0-9-]{1,128}$/i;
      if (!conversationIdPattern.test(conversationId)) {
        return invalidRequestError('Conversation ID must be alphanumeric with hyphens, max 128 characters');
      }
    }

    // AC #3: Proxy request to Dify API
    const difyClient = createDifyClient();
    const difyRequest: DifyChatRequest = {
      query: message,
      user: user.id,
      response_mode: 'streaming',
      conversation_id: conversationId,
      inputs: {},
    };

    const stream = await difyClient.chatMessages(difyRequest);

    // AC #4: Stream SSE response back to client
    if (!(stream instanceof ReadableStream)) {
      // Should not happen for streaming mode, but handle gracefully
      return NextResponse.json(stream);
    }

    // Story 3.2 AC #1: Capture conversation_id and message from SSE stream
    let capturedConversationId: string | null = null;
    let capturedAnswer = '';
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Decode chunk to string
        const text = decoder.decode(chunk, { stream: true });

        // Parse SSE events to extract conversation_id and answer
        const event = parseSSEEvent(text);
        if (event) {
          if (event.conversation_id && !capturedConversationId) {
            capturedConversationId = event.conversation_id;
            Sentry.addBreadcrumb({
              category: 'chat',
              message: 'Conversation ID captured',
              data: { conversationId: capturedConversationId },
            });
          }

          // Accumulate answer text for thread preview
          if (event.answer) {
            capturedAnswer += event.answer;
          }
        }

        // Pass through all data to client
        controller.enqueue(chunk);
      },

      async flush() {
        // AC #3: Async thread creation after stream completes
        if (capturedConversationId && capturedAnswer) {
          // Fire-and-forget: Don't await, don't block response
          Promise.resolve().then(async () => {
            await createOrUpdateThread(supabase, user.id, capturedConversationId!, capturedAnswer);
          });
        } else {
          logger.warn(
            { capturedConversationId, hasAnswer: !!capturedAnswer },
            'Thread creation skipped - missing conversation_id or answer',
          );
        }
      },
    });

    // Pipe Dify stream through transform
    const transformedStream = stream.pipeThrough(transformStream);

    // Return streaming response with proper headers
    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    // AC #5: Handle Dify API errors
    logApiError(error, {
      endpoint: '/api/chat',
      method: 'POST',
      errorCode: error.code || (error.status ? 'DIFY_ERROR' : 'INTERNAL_ERROR'),
      statusCode: error.status || 500,
    });

    // Handle Dify-specific errors with custom codes (e.g., rate limit)
    if (error.status && error.code) {
      return NextResponse.json(
        {
          error: error.message || 'Request failed',
          code: error.code,
        },
        { status: error.status },
      );
    }

    // Handle Dify-specific errors without custom codes
    if (error.status) {
      return difyError(
        error.message || 'AI service temporarily unavailable',
        error.details,
      );
    }

    // Generic error
    return internalError();
  }
}
