import { Env } from '@/libs/Env';

/**
 * Dify API Configuration
 *
 * Provides configuration for the Dify AI chat service.
 * Environment variables are optional to allow graceful degradation.
 *
 * Required environment variables:
 * - DIFY_API_KEY: Your Dify API key from https://dify.ai
 * - DIFY_API_URL: Dify API base URL (default: https://api.dify.ai/v1)
 *
 * If not configured, the chat interface will display a setup message.
 */

export const DIFY_CONFIG = {
  // API credentials - optional to allow graceful degradation
  apiKey: Env.DIFY_API_KEY || '',
  apiUrl: Env.DIFY_API_URL || 'https://api.dify.ai/v1',

  // API endpoints
  endpoints: {
    chatMessages: '/chat-messages',
    messages: '/messages', // Conversation history endpoint
  },

  // Default request timeout (30 seconds)
  defaultTimeout: 30000,
} as const;

/**
 * Check if Dify is properly configured
 * @returns true if DIFY_API_KEY and DIFY_API_URL are set
 */
export function isDifyConfigured(): boolean {
  return !!(Env.DIFY_API_KEY && Env.DIFY_API_URL);
}

export const DIFY_RESPONSE_MODES = {
  STREAMING: 'streaming',
  BLOCKING: 'blocking',
} as const;
