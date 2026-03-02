/**
 * TypeScript types for Vercel AI SDK chat integration
 */

/**
 * Message role types supported by the AI SDK
 */
export type MessageRole = 'user' | 'assistant' | 'system';

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
