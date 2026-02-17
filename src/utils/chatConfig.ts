/**
 * Chat Configuration Utility
 *
 * Detects which chat providers are configured based on environment variables.
 * Server-side only - used in server components and API routes.
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
