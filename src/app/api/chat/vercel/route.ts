import * as Sentry from '@sentry/nextjs';
import { streamText } from 'ai';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import {
  internalError,
  invalidRequestError,
  logApiError,
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
import type { VercelChatRequest } from '@/libs/vercel-ai/types';

/**
 * POST /api/chat/vercel
 *
 * Streaming chat API endpoint using Vercel AI SDK.
 * This is an alternative to the Dify implementation at /api/chat.
 *
 * SSE Streaming Pattern: Vercel AI SDK integration
 * See: docs/patterns/sse-streaming.md for full documentation
 *
 * Security Model:
 * - All AI provider API keys stay server-side only (never exposed to client)
 * - Session validation via Supabase Auth
 * - RLS enforced on all database queries
 * - Users can only access their own conversations
 *
 * Streaming Protocol:
 * - Server-Sent Events (SSE) format compatible with useChat hook
 * - Real-time token-by-token streaming
 * - Proper headers: text/event-stream, no-cache, keep-alive
 *
 * Message Persistence:
 * - User messages saved before streaming starts
 * - Assistant responses saved after streaming completes
 * - Fire-and-forget pattern (doesn't block response)
 * - Token counts and latency tracked in metadata
 *
 * Conversation Management:
 * - New conversations auto-created on first message
 * - Existing conversations updated with new messages
 * - Title auto-generated from first message (first 50 chars)
 * - Preview updated with last message (first 100 chars)
 *
 * Error Handling:
 * - 401 for unauthenticated requests
 * - 400 for invalid input (empty message, malformed conversationId)
 * - 500 for AI provider errors (timeout, rate limit, etc.)
 * - All errors logged to Sentry with context
 *
 * Related Routes:
 * - /api/chat - Dify implementation (separate persistence)
 * - /chat/vercel - Frontend UI (Story 10.7)
 *
 * Related Documentation:
 * - SSE Streaming: docs/patterns/sse-streaming.md
 * - Vercel AI SDK: https://sdk.vercel.ai/docs
 * - API Error Handling: docs/api-error-handling.md
 *
 * @see {@link https://sdk.vercel.ai/docs/ai-sdk-core/streaming Streaming Documentation}
 */
export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // AC #4: Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // AC #4: Return 401 for unauthenticated requests
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
    const body: VercelChatRequest = await request.json();
    const { message, conversationId } = body;

    // Validate message (required)
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

      // Validate UUID format
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

    // AC #2 & #3: Handle conversation creation/retrieval
    let activeConversationId: string;

    if (conversationId) {
      // Verify conversation exists and belongs to user
      const { data: existingConversation, error: fetchError } = await getConversationById(
        supabase,
        conversationId,
      );

      if (fetchError || !existingConversation) {
        // Return 404 for not found (security: don't reveal existence)
        return invalidRequestError('Conversation not found');
      }

      // Verify ownership (RLS should handle this, but double-check)
      if (existingConversation.userId !== user.id) {
        return unauthorizedError();
      }

      activeConversationId = conversationId;
    } else {
      // AC #2: Create new conversation
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

    // AC #2: Persist user message before streaming
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

    // AC #1 & #6: Create AI provider and stream response
    const model = await createAIProvider();

    // Memory Integration: Fetch relevant memories for context (if enabled)
    // This is a fire-and-forget operation that doesn't block the chat
    // If Mem0 is disabled or fetch fails, returns empty array
    const memories = await getRelevantMemories(user.id, message);
    const memoryContext = formatMemoriesForPrompt(memories);

    // Get conversation history for context
    // Note: For now, we'll just send the current message
    // Future enhancement: Load conversation history from database
    const messages = [
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // AC #1 & #7: Stream text using Vercel AI SDK
    // streamText automatically handles SSE formatting and streaming
    // See: docs/patterns/sse-streaming.md#vercel-ai-sdk-integration
    //
    // LangFuse Tracing: experimental_telemetry enables automatic tracing via OpenTelemetry
    // When LangFuse is configured (via instrumentation.ts), this captures:
    // - Input messages and output completions
    // - Token usage (prompt + completion + total)
    // - Latency metrics (request duration)
    // - Model metadata
    // - User ID and session ID (added via metadata)
    //
    // Memory Integration: If memories exist, they're prepended to system prompt
    // This provides the AI with context from previous conversations
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

    // AC #7: Convert to SSE response with proper headers
    // toDataStreamResponse() returns Next.js Response with SSE headers
    // Format compatible with useChat hook on client
    // See: docs/patterns/sse-streaming.md#todatastreamresponse
    const response = result.toDataStreamResponse();

    // AC #2 & #5: Persist assistant response after streaming completes
    // Fire-and-forget pattern (doesn't block response)
    Promise.resolve()
      .then(async () => {
        // Wait for stream to complete and get final result
        // The result object provides promises that resolve when streaming finishes
        const finalText = await result.text;
        const finalUsage = await result.usage;

        // AC #5: Extract token count and calculate latency
        const tokenCount = finalUsage?.totalTokens ?? null;
        const latencyMs = Date.now() - startTime;

        // AC #2: Persist assistant message
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

        // AC #3: Update conversation metadata
        const lastMessagePreview = finalText.slice(0, 100);
        const { error: updateError } = await updateConversation(
          supabase,
          activeConversationId,
          {
            lastMessagePreview,
          },
        );

        if (updateError) {
          logger.error(
            { error: updateError, conversationId: activeConversationId },
            'Failed to update conversation metadata',
          );
          Sentry.captureException(updateError);
        }

        // AC #5: Log metrics for monitoring
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

        // Memory Integration: Queue memory extraction job (fire-and-forget)
        // This happens after conversation completes and doesn't block the response
        // If Mem0 is disabled or queueing fails, errors are logged but don't throw
        queueMemoryExtraction(activeConversationId).catch((error: any) => {
          logger.error(
            { error, conversationId: activeConversationId },
            'Failed to queue memory extraction',
          );
          Sentry.captureException(error);
        });
      })
      .catch((error: any) => {
        // AC #3: Catch any unhandled errors in the persistence chain
        // Errors don't block chat response (already sent to client)
        logger.error(
          { error, conversationId: activeConversationId },
          'Message persistence failed',
        );
        Sentry.captureException(error);
      });

    return response;
  } catch (error: any) {
    // AC #7: Handle streaming errors
    logApiError(error, {
      endpoint: '/api/chat/vercel',
      method: 'POST',
      errorCode: error.code || 'INTERNAL_ERROR',
      statusCode: error.status || 500,
    });

    // Handle AI provider specific errors
    if (error.message?.includes('API key')) {
      // Don't expose API key issues to client
      logger.error({ error }, 'AI provider API key error');
      return internalError();
    }

    if (error.message?.includes('timeout')) {
      return new Response(
        JSON.stringify({
          error: 'Request timeout',
          code: 'TIMEOUT',
        }),
        {
          status: 408,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (error.message?.includes('rate limit')) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        },
      );
    }

    // Generic error
    return internalError();
  }
}
