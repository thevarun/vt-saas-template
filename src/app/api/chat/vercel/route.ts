import * as Sentry from '@sentry/nextjs';
import { streamText } from 'ai';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import {
  internalError,
  invalidRequestError,
  logApiError,
  rateLimitError,
  timeoutError,
  unauthorizedError,
} from '@/libs/api/errors';
import { logger } from '@/libs/Logger';
import {
  formatMemoriesForPrompt,
  getRelevantMemories,
} from '@/libs/mem0/retrieval';
import { createMessage } from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';
import { createAIProvider } from '@/libs/vercel-ai/client';
import { isConfigured } from '@/libs/vercel-ai/config';

import {
  ensureConversation,
  extractUserMessage,
  normalizeMessagesForAI,
  persistAssistantResponse,
  vercelChatRequestSchema,
} from './helpers';

/** Streaming chat endpoint using Vercel AI SDK. Alternative to the Dify implementation at /api/chat. */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();

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

    // Check if Vercel AI SDK is configured
    if (!isConfigured()) {
      return invalidRequestError(
        'AI chat is not configured. Please set up OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables.',
      );
    }

    // Extract and validate request body
    const rawBody = await request.json();
    const parseResult = vercelChatRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return invalidRequestError('Invalid request body');
    }
    const body = parseResult.data;
    const conversationId: string | undefined = body.conversationId ?? undefined;

    // Extract user message from various formats
    const message = extractUserMessage(body);

    if (!message) {
      return invalidRequestError('Message is required');
    }

    if (message.length > 10000) {
      return invalidRequestError('Message exceeds maximum length of 10,000 characters');
    }

    Sentry.addBreadcrumb({
      category: 'chat',
      message: 'Vercel AI chat request received',
      data: {
        userId: user.id,
        hasConversationId: !!conversationId,
        messageLength: message.length,
      },
    });

    // Start memory retrieval immediately (doesn't depend on conversation state)
    const memoriesPromise = getRelevantMemories(user.id, message);

    // Ensure conversation exists (create if new, verify ownership if existing)
    const convResult = await ensureConversation(conversationId, user.id, message);
    if (!convResult.ok) {
      return convResult.error;
    }
    const { conversationId: activeConversationId, isNew } = convResult;

    // For existing conversations, persist user message (fire-and-forget, don't block)
    if (!isNew) {
      createMessage(activeConversationId, 'user', message).then(({ error }) => {
        if (error) {
          logger.error(
            { error, conversationId: activeConversationId },
            'Failed to persist user message',
          );
        }
      });
    }

    // Create AI provider and await memories (already in flight)
    const model = await createAIProvider();
    const memories = await memoriesPromise;
    const memoryContext = formatMemoriesForPrompt(memories);

    // Normalize messages for AI and stream response
    const messages = normalizeMessagesForAI(body, message);

    const result = streamText({
      model,
      messages,
      system: memoryContext || undefined,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'vercel-chat-stream',
        metadata: {
          userId: user.id,
          conversationId: activeConversationId,
        },
      },
    });

    const response = result.toUIMessageStreamResponse();

    // Fire-and-forget: persist assistant response after streaming completes
    persistAssistantResponse({
      result,
      conversationId: activeConversationId,
      userId: user.id,
      startTime,
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const errCode = (error instanceof Error && 'code' in error) ? (error as { code: string }).code : undefined;
    const errStatus = (error instanceof Error && 'status' in error) ? (error as { status: number }).status : undefined;

    logApiError(error, {
      endpoint: '/api/chat/vercel',
      method: 'POST',
      errorCode: errCode || 'INTERNAL_ERROR',
      statusCode: errStatus || 500,
    });

    if (errMessage?.includes('API key')) {
      logger.error({ error }, 'AI provider API key error');
      return internalError();
    }

    if (errMessage?.includes('timeout')) {
      return timeoutError();
    }

    if (errMessage?.includes('rate limit')) {
      return rateLimitError();
    }

    return internalError();
  }
}
