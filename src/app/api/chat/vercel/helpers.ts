import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

import { invalidRequestError } from '@/libs/api/errors';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { queueMemoryExtraction } from '@/libs/mem0/queue';
import {
  getConversationById,
  updateConversation,
} from '@/libs/queries/vercelConversations';
import { createMessage } from '@/libs/queries/vercelMessages';
import { vercelConversations, vercelMessages } from '@/models/Schema';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const chatMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().optional(),
  parts: z.array(chatMessagePartSchema).optional(),
});

export const vercelChatRequestSchema = z.object({
  message: z.string().optional(),
  messages: z.array(chatMessageSchema).optional(),
  conversationId: z.string().uuid().optional().nullable(),
});

export type ParsedChatBody = z.infer<typeof vercelChatRequestSchema>;

// ─── Message Parsing ─────────────────────────────────────────────────────────

/**
 * Extract user message text from the validated request body.
 * Supports both simple format ({ message: string }) and
 * AssistantChatTransport format ({ messages: [{role, parts}...] }).
 *
 * @returns The extracted message string, or empty string if none found.
 */
export function extractUserMessage(body: ParsedChatBody): string {
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const lastUserMessage = [...body.messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage?.parts) {
      const textPart = lastUserMessage.parts.find(p => p.type === 'text');
      return textPart?.text ?? '';
    }
    return lastUserMessage?.content ?? '';
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  return '';
}

/**
 * Convert messages array to standard {role, content} format for streamText.
 * Filters out system messages to prevent prompt injection.
 */
export function normalizeMessagesForAI(
  body: ParsedChatBody,
  fallbackMessage: string,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const ALLOWED_ROLES = new Set(['user', 'assistant']);

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return body.messages
      .filter(m => ALLOWED_ROLES.has(m.role))
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.parts
          ? m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
          : m.content ?? '',
      }));
  }

  return [{ role: 'user' as const, content: fallbackMessage }];
}

// ─── Conversation Management ─────────────────────────────────────────────────

type EnsureConversationResult
  = | { ok: true; conversationId: string; isNew: boolean }
    | { ok: false; error: Response };

/**
 * Ensures a valid conversation exists for the chat request.
 * - If conversationId is provided, verifies it exists and belongs to the user.
 * - If not provided, creates a new conversation + first user message atomically.
 */
export async function ensureConversation(
  conversationId: string | undefined,
  userId: string,
  message: string,
): Promise<EnsureConversationResult> {
  if (conversationId) {
    const { data: existing, error } = await getConversationById(conversationId, userId);
    if (error || !existing) {
      return { ok: false, error: invalidRequestError('Conversation not found') };
    }
    return { ok: true, conversationId, isNew: false };
  }

  const title = message.slice(0, 50) || 'New Conversation';

  try {
    const txResult = await db.transaction(async (tx) => {
      const [newConv] = await tx.insert(vercelConversations).values({
        userId,
        title,
        lastMessagePreview: null,
        archived: false,
      }).returning();

      if (!newConv) {
        throw new Error('Failed to create conversation');
      }

      await tx.insert(vercelMessages).values({
        conversationId: newConv.id,
        role: 'user',
        content: message,
      });

      return newConv.id;
    });

    Sentry.addBreadcrumb({
      category: 'conversation',
      message: 'New conversation created',
      data: { conversationId: txResult },
    });

    return { ok: true, conversationId: txResult, isNew: true };
  } catch (txError) {
    logger.error({ error: txError, userId }, 'Failed to create conversation with message');
    return { ok: false, error: new Response(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }), { status: 500, headers: { 'Content-Type': 'application/json' } }) };
  }
}

// ─── Post-Stream Persistence ─────────────────────────────────────────────────

/**
 * Fire-and-forget: persist assistant response, update conversation metadata,
 * log metrics, and queue memory extraction after streaming completes.
 */
export function persistAssistantResponse(params: {
  result: { text: PromiseLike<string>; usage: PromiseLike<{ totalTokens?: number } | undefined> };
  conversationId: string;
  userId: string;
  startTime: number;
}): void {
  const { result, conversationId, userId, startTime } = params;

  Promise.resolve()
    .then(async () => {
      const finalText = await result.text;
      const finalUsage = await result.usage;

      const rawTokenCount = finalUsage?.totalTokens;
      const tokenCount = (typeof rawTokenCount === 'number' && !Number.isNaN(rawTokenCount)) ? rawTokenCount : null;
      const latencyMs = Date.now() - startTime;

      // Persist assistant message
      const { error: assistantMessageError } = await createMessage(
        conversationId,
        'assistant',
        finalText,
        { tokenCount, latencyMs },
      );

      if (assistantMessageError) {
        logger.error(
          { error: assistantMessageError, conversationId },
          'Failed to persist assistant message',
        );
        Sentry.captureException(assistantMessageError);
      }

      // Update conversation metadata
      const lastMessagePreview = finalText.slice(0, 100);
      const { error: updateError } = await updateConversation(
        conversationId,
        { lastMessagePreview },
        userId,
      );

      if (updateError) {
        logger.error(
          { error: updateError, conversationId },
          'Failed to update conversation metadata',
        );
        Sentry.captureException(updateError);
      }

      // Log metrics
      Sentry.addBreadcrumb({
        category: 'chat-metrics',
        message: 'Chat completion metrics',
        data: { conversationId, tokenCount, latencyMs, textLength: finalText.length },
      });

      logger.info(
        { conversationId, tokenCount, latencyMs, textLength: finalText.length },
        'Chat completion successful',
      );

      // Queue memory extraction (fire-and-forget)
      queueMemoryExtraction(conversationId).catch((error: unknown) => {
        logger.error({ error, conversationId }, 'Failed to queue memory extraction');
        Sentry.captureException(error);
      });
    })
    .catch((error: unknown) => {
      logger.error({ error, conversationId }, 'Message persistence failed');
      Sentry.captureException(error);
    });
}
