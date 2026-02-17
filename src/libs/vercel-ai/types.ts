/**
 * TypeScript types for Vercel AI SDK chat integration
 */

/**
 * Message role types supported by the AI SDK
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Request body for Vercel AI SDK chat endpoint
 */
export type VercelChatRequest = {
  /**
   * User message text to send to the AI
   */
  message: string;

  /**
   * Optional conversation ID for continuing an existing conversation
   * If not provided, a new conversation will be created
   */
  conversationId?: string;
};

/**
 * Metadata stored with each message for tracking and analytics
 */
export type MessageMetadata = {
  /**
   * Total tokens consumed (prompt + completion)
   * Null if provider doesn't return token counts
   */
  tokenCount?: number | null;

  /**
   * Latency in milliseconds from request start to response completion
   * Only present for assistant messages
   */
  latencyMs?: number | null;
};

/**
 * Conversation metadata for database storage
 */
export type ConversationMetadata = {
  /**
   * Conversation title (auto-generated from first message)
   */
  title?: string;

  /**
   * Preview of the last message (first 100 characters)
   */
  lastMessagePreview?: string;

  /**
   * Whether the conversation is archived
   */
  archived?: boolean;
};
