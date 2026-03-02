import * as Sentry from '@sentry/nextjs';
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
import type { DifyChatRequest, DifyStreamEvent } from '@/libs/dify/types';
import { logger } from '@/libs/Logger';
import {
  createThread,
  getThreadByConversationId,
  updateThread,
} from '@/libs/queries/threads';
import { createClient } from '@/libs/supabase/server';
import { CHAT_MAX_MESSAGE_LENGTH, CONVERSATION_ID_PATTERN } from '@/libs/validations/chat';

/** Dify chat proxy endpoint. Validates Supabase session and streams SSE responses from Dify API. */

/** Parse JSON data from an SSE-formatted chunk (e.g. "data: {json}\n\n"). */
function parseSSEEvent(chunk: string): DifyStreamEvent | null {
  try {
    const dataMatch = chunk.match(/data: (.+)/);
    if (!dataMatch?.[1]) {
      return null;
    }

    const jsonStr = dataMatch[1].trim();
    return JSON.parse(jsonStr) as DifyStreamEvent;
  } catch {
    return null;
  }
}

/** Create or update a thread record after receiving a Dify response. userId filter enforces ownership. */
async function createOrUpdateThread(
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

    const { data: existingThread, error: fetchError } = await getThreadByConversationId(
      conversationId,
      userId,
    );

    if (fetchError) {
      logger.warn({ error: fetchError, conversationId }, 'Error checking existing thread');
    }

    if (existingThread) {
      // Update existing thread metadata
      const lastMessagePreview = messageText.slice(0, 100);

      const { error: updateError } = await updateThread(
        existingThread.id,
        { lastMessagePreview },
        userId,
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
      // Create new thread
      const title = messageText.slice(0, 50) || 'New Conversation';
      const lastMessagePreview = messageText.slice(0, 100);

      const { data: newThread, error: createError } = await createThread(
        userId,
        {
          conversationId,
          title,
          lastMessagePreview,
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
  } catch (error: unknown) {
    // Errors don't block chat response
    Sentry.addBreadcrumb({
      category: 'thread',
      level: 'error',
      message: 'Thread creation/update failed',
      data: { error: error instanceof Error ? error.message : 'Unknown error', conversationId },
    });

    Sentry.captureException(error);
    logger.error({ error, conversationId }, 'Thread persistence failed');
  }
}

/** Chat endpoint that validates Supabase session and proxies streaming requests to Dify API. */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedError();
    }

    // Extract message and conversationId from request body
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return invalidRequestError('Message is required');
    }

    if (message.length > CHAT_MAX_MESSAGE_LENGTH) {
      return invalidRequestError(`Message exceeds maximum length of ${CHAT_MAX_MESSAGE_LENGTH.toLocaleString()} characters`);
    }

    // Validate conversation ID format if provided
    if (conversationId !== undefined && conversationId !== null) {
      if (typeof conversationId !== 'string') {
        return invalidRequestError('Conversation ID must be a string');
      }

      if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
        return invalidRequestError('Conversation ID must be alphanumeric with hyphens, max 128 characters');
      }
    }

    // Proxy request to Dify API
    const difyClient = createDifyClient();
    const difyRequest: DifyChatRequest = {
      query: message,
      user: user.id,
      response_mode: 'streaming',
      conversation_id: conversationId,
      inputs: {},
    };

    const stream = await difyClient.chatMessages(difyRequest);

    if (!(stream instanceof ReadableStream)) {
      return NextResponse.json(stream);
    }

    // Capture conversation_id and message from SSE stream for thread persistence
    let capturedConversationId: string | null = null;
    let capturedAnswer = '';
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });

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

          if (event.answer) {
            capturedAnswer += event.answer;
          }
        }

        controller.enqueue(chunk);
      },

      async flush() {
        // Async thread creation after stream completes (fire-and-forget)
        if (capturedConversationId && capturedAnswer) {
          Promise.resolve().then(async () => {
            await createOrUpdateThread(user.id, capturedConversationId!, capturedAnswer);
          });
        } else {
          logger.warn(
            { capturedConversationId, hasAnswer: !!capturedAnswer },
            'Thread creation skipped - missing conversation_id or answer',
          );
        }
      },
    });

    const transformedStream = stream.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errObj = error as Record<string, unknown> | null;
    const errMessage = error instanceof Error ? error.message : (typeof errObj?.message === 'string' ? errObj.message : String(error));
    const errCode = typeof errObj?.code === 'string' ? errObj.code : undefined;
    const errStatus = typeof errObj?.status === 'number' ? errObj.status : undefined;
    const errDetails = errObj?.details as Record<string, unknown> | undefined;

    logApiError(error, {
      endpoint: '/api/chat',
      method: 'POST',
      errorCode: errCode || (errStatus ? 'DIFY_ERROR' : 'INTERNAL_ERROR'),
      statusCode: errStatus || 500,
    });

    if (errStatus && errCode) {
      return NextResponse.json(
        {
          error: errMessage || 'Request failed',
          code: errCode,
        },
        { status: errStatus },
      );
    }

    if (errStatus) {
      return difyError(
        errMessage || 'AI service temporarily unavailable',
        errDetails,
      );
    }

    return internalError();
  }
}
