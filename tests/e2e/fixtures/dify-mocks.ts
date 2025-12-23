/**
 * Dify API Mock Fixtures
 * Reusable mock responses for E2E tests
 *
 * These fixtures mirror the actual Dify API event structure to ensure
 * tests accurately represent production behavior.
 *
 * Event Types (as per Dify API v1):
 * - "message": Streaming message content (may be sent multiple times for progressive updates)
 * - "message_end": Indicates completion of message streaming
 * - "error": Error event from Dify API
 * - "ping": Keep-alive ping event
 */

type DifyMessageEvent = {
  event: 'message';
  message_id: string;
  conversation_id?: string;
  answer: string;
};

type DifyMessageEndEvent = {
  event: 'message_end';
  message_id: string;
  conversation_id?: string;
};

type DifyErrorEvent = {
  event: 'error';
  status: number;
  code: string;
  message: string;
};

/**
 * Creates a Dify "message" event (SSE format)
 * Used for streaming message content
 */
export function createMessageEvent(
  messageId: string,
  answer: string,
  conversationId?: string,
): string {
  const event: DifyMessageEvent = {
    event: 'message',
    message_id: messageId,
    answer,
  };

  if (conversationId) {
    event.conversation_id = conversationId;
  }

  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates a Dify "message_end" event (SSE format)
 * Signals completion of message streaming
 */
export function createMessageEndEvent(
  messageId: string,
  conversationId?: string,
): string {
  const event: DifyMessageEndEvent = {
    event: 'message_end',
    message_id: messageId,
  };

  if (conversationId) {
    event.conversation_id = conversationId;
  }

  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates a Dify "error" event (SSE format)
 */
export function createErrorEvent(
  status: number,
  code: string,
  message: string,
): string {
  const event: DifyErrorEvent = {
    event: 'error',
    status,
    code,
    message,
  };

  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates a complete SSE response with message and message_end events
 * This is the most common pattern for a successful Dify response
 */
export function createCompleteMessageResponse(
  messageId: string,
  answer: string,
  conversationId?: string,
): string {
  return (
    createMessageEvent(messageId, answer, conversationId)
    + createMessageEndEvent(messageId, conversationId)
  );
}

/**
 * Creates a streaming response with multiple message chunks
 * Simulates progressive streaming of content
 */
export function createStreamingMessageResponse(
  messageId: string,
  chunks: string[],
  conversationId?: string,
): string {
  let response = '';

  for (const chunk of chunks) {
    response += createMessageEvent(messageId, chunk, conversationId);
  }

  response += createMessageEndEvent(messageId, conversationId);

  return response;
}

/**
 * Pre-configured mock responses for common test scenarios
 */
export const MockResponses = {
  /**
   * Simple greeting response
   */
  greeting: (conversationId = 'conv-123') =>
    createCompleteMessageResponse(
      'msg-123',
      'Hello! How can I help you today?',
      conversationId,
    ),

  /**
   * Health advice with multiple chunks (streaming simulation)
   */
  healthAdvice: (conversationId = 'conv-456') =>
    createStreamingMessageResponse(
      'msg-456',
      [
        'Here are some healthy breakfast options:',
        '\n1. Oatmeal with berries',
        '\n2. Greek yogurt with nuts',
      ],
      conversationId,
    ),

  /**
   * Contextual follow-up response
   */
  followUp: (conversationId: string) =>
    createCompleteMessageResponse(
      'msg-follow-up',
      'Based on our previous conversation, here\'s my recommendation...',
      conversationId,
    ),

  /**
   * Mobile-optimized short response
   */
  mobileResponse: () =>
    createCompleteMessageResponse('msg-mobile', 'Mobile response'),

  /**
   * Delayed response (for loading state testing)
   */
  delayedResponse: () =>
    createCompleteMessageResponse('msg-789', 'Response after delay'),

  /**
   * Error response
   */
  error: () =>
    createErrorEvent(500, 'INTERNAL_ERROR', 'Internal server error'),
};
