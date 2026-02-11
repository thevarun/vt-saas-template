/**
 * Chat Configuration Utility
 *
 * Detects which chat providers are configured based on environment variables.
 * Provides both server-side and client-side configuration checks.
 *
 * Usage:
 * - Server-side: Use getChatConfig() to check actual env vars
 * - Client-side: Use getPublicChatConfig() to check NEXT_PUBLIC_ vars
 */

export type ChatProvider = 'dify' | 'vercel';

export type ChatConfig = {
  dify: {
    configured: boolean;
    url?: string;
  };
  vercel: {
    configured: boolean;
    provider?: 'openai' | 'anthropic';
  };
};

/**
 * Get chat configuration (server-side)
 *
 * Checks actual environment variables to determine which chat providers are configured.
 * Use this in server components and API routes.
 *
 * @returns ChatConfig object with configuration status for each provider
 */
export function getChatConfig(): ChatConfig {
  return {
    dify: {
      configured: Boolean(
        process.env.DIFY_API_URL && process.env.DIFY_API_KEY,
      ),
      url: process.env.DIFY_API_URL,
    },
    vercel: {
      configured: Boolean(
        process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
      ),
      provider: process.env.OPENAI_API_KEY ? 'openai' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : undefined,
    },
  };
}

/**
 * Get public chat configuration (client-side)
 *
 * Checks NEXT_PUBLIC_ environment variables to determine which chat providers are configured.
 * Use this in client components.
 *
 * Note: This only checks for the presence of NEXT_PUBLIC_DIFY_API_URL as an indicator.
 * The actual API keys should never be exposed to the client.
 *
 * @returns ChatConfig object with configuration status for each provider
 */
export function getPublicChatConfig(): ChatConfig {
  return {
    dify: {
      configured: Boolean(process.env.NEXT_PUBLIC_DIFY_API_URL),
      url: process.env.NEXT_PUBLIC_DIFY_API_URL,
    },
    vercel: {
      configured: Boolean(
        process.env.NEXT_PUBLIC_OPENAI_API_KEY
        || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      ),
      provider: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'openai' : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ? 'anthropic' : undefined,
    },
  };
}
