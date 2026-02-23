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
import { queueMemoryExtraction } from '@/libs/mem0/queue';
import {
  formatMemoriesForPrompt,
  getRelevantMemories,
} from '@/libs/mem0/retrieval';
import {
  createConversation,
  getConversationById,
  updateConversation,
} from '@/libs/queries/vercelConversations';
import { createMessage } from '@/libs/queries/vercelMessages';
import { createClient } from '@/libs/supabase/server';
import { createAIProvider } from '@/libs/vercel-ai/client';
import { isConfigured } from '@/libs/vercel-ai/config';

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
    // Supports AssistantChatTransport format ({ messages: [{role, parts}...] })
    // and simple format ({ message: string })
    const body = await request.json();
    const conversationId: string | undefined = body.conversationId;

    // Extract message from various formats
    let message: string;
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      // AssistantChatTransport format: messages[].parts[{type:"text", text:"..."}]
      const lastUserMessage = [...body.messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMessage?.parts) {
        const textPart = lastUserMessage.parts.find((p: any) => p.type === 'text');
        message = textPart?.text ?? '';
      } else {
        message = lastUserMessage?.content ?? '';
      }
    } else if (typeof body.message === 'string') {
      message = body.message;
    } else {
      message = '';
    }

    if (!message) {
      return invalidRequestError('Message is required');
    }

    if (message.length > 10000) {
      return invalidRequestError('Message exceeds maximum length of 10,000 characters');
    }

    // Validate conversation ID format if provided
    if (conversationId !== undefined && conversationId !== null) {
      if (typeof conversationId !== 'string') {
        return invalidRequestError('Conversation ID must be a string');
      }

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(conversationId)) {
        return invalidRequestError('Conversation ID must be a valid UUID');
      }
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

    // Handle conversation creation/retrieval
    let activeConversationId: string;

    if (conversationId) {
      // Verify conversation exists and belongs to user (userId filter enforces ownership)
      const { data: existingConversation, error: fetchError } = await getConversationById(
        supabase,
        conversationId,
        user.id,
      );

      if (fetchError || !existingConversation) {
        return invalidRequestError('Conversation not found');
      }

      activeConversationId = conversationId;
    } else {
      // Create new conversation
      const title = message.slice(0, 50) || 'New Conversation';
      const { data: newConversation, error: createError } = await createConversation(
        supabase,
        user.id,
        title,
      );

      if (createError || !newConversation) {
        logger.error({ error: createError, userId: user.id }, 'Failed to create conversation');
        return internalError();
      }

      activeConversationId = newConversation.id;

      Sentry.addBreadcrumb({
        category: 'conversation',
        message: 'New conversation created',
        data: { conversationId: activeConversationId },
      });
    }

    // Persist user message before streaming
    const { error: userMessageError } = await createMessage(
      supabase,
      activeConversationId,
      'user',
      message,
    );

    if (userMessageError) {
      logger.error(
        { error: userMessageError, conversationId: activeConversationId },
        'Failed to persist user message',
      );
      // Continue anyway - don't block the chat
    }

    // Create AI provider and stream response
    const model = await createAIProvider();

    // Fetch relevant memories for context (returns empty array if disabled or on error)
    const memories = await getRelevantMemories(user.id, message);
    const memoryContext = formatMemoriesForPrompt(memories);

    // Convert messages to standard {role, content} format for streamText
    const messages = Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.parts
            ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
            : m.content ?? '',
        }))
      : [{ role: 'user' as const, content: message }];

    // Stream text using Vercel AI SDK (handles SSE formatting automatically)
    // experimental_telemetry enables LangFuse tracing via OpenTelemetry when configured
    const result = streamText({
      model,
      messages,
      system: memoryContext || undefined, // Only set if memories exist
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'vercel-chat-stream',
        metadata: {
          userId: user.id,
          conversationId: activeConversationId,
        },
      },
    });

    // toUIMessageStreamResponse() is required for AssistantChatTransport (AI SDK v5)
    const response = result.toUIMessageStreamResponse();

    // Persist assistant response after streaming completes (fire-and-forget)
    Promise.resolve()
      .then(async () => {
        const finalText = await result.text;
        const finalUsage = await result.usage;

        const rawTokenCount = finalUsage?.totalTokens;
        const tokenCount = (typeof rawTokenCount === 'number' && !Number.isNaN(rawTokenCount)) ? rawTokenCount : null;
        const latencyMs = Date.now() - startTime;

        // Persist assistant message
        const { error: assistantMessageError } = await createMessage(
          supabase,
          activeConversationId,
          'assistant',
          finalText,
          {
            tokenCount,
            latencyMs,
          },
        );

        if (assistantMessageError) {
          logger.error(
            { error: assistantMessageError, conversationId: activeConversationId },
            'Failed to persist assistant message',
          );
          Sentry.captureException(assistantMessageError);
        }

        // Update conversation metadata
        const lastMessagePreview = finalText.slice(0, 100);
        const { error: updateError } = await updateConversation(
          supabase,
          activeConversationId,
          {
            lastMessagePreview,
          },
          user.id,
        );

        if (updateError) {
          logger.error(
            { error: updateError, conversationId: activeConversationId },
            'Failed to update conversation metadata',
          );
          Sentry.captureException(updateError);
        }

        // Log metrics
        Sentry.addBreadcrumb({
          category: 'chat-metrics',
          message: 'Chat completion metrics',
          data: {
            conversationId: activeConversationId,
            tokenCount,
            latencyMs,
            textLength: finalText.length,
          },
        });

        logger.info(
          {
            conversationId: activeConversationId,
            tokenCount,
            latencyMs,
            textLength: finalText.length,
          },
          'Chat completion successful',
        );

        // Queue memory extraction (fire-and-forget)
        queueMemoryExtraction(activeConversationId).catch((error: any) => {
          logger.error(
            { error, conversationId: activeConversationId },
            'Failed to queue memory extraction',
          );
          Sentry.captureException(error);
        });
      })
      .catch((error: any) => {
        logger.error(
          { error, conversationId: activeConversationId },
          'Message persistence failed',
        );
        Sentry.captureException(error);
      });

    return response;
  } catch (error: any) {
    logApiError(error, {
      endpoint: '/api/chat/vercel',
      method: 'POST',
      errorCode: error.code || 'INTERNAL_ERROR',
      statusCode: error.status || 500,
    });

    if (error.message?.includes('API key')) {
      logger.error({ error }, 'AI provider API key error');
      return internalError();
    }

    if (error.message?.includes('timeout')) {
      return timeoutError();
    }

    if (error.message?.includes('rate limit')) {
      return rateLimitError();
    }

    return internalError();
  }
}
