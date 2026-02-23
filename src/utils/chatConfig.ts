/**
 * Chat Configuration Utility
 *
 * Detects which chat providers are configured based on environment variables.
 * Server-side only - used in server components and API routes.
 */

import { Env } from '@/libs/Env';

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
      configured: Boolean(Env.DIFY_API_URL && Env.DIFY_API_KEY),
      url: Env.DIFY_API_URL,
    },
    vercel: {
      configured: Boolean(Env.OPENAI_API_KEY || Env.ANTHROPIC_API_KEY),
      provider: Env.OPENAI_API_KEY ? 'openai' : Env.ANTHROPIC_API_KEY ? 'anthropic' : undefined,
    },
  };
}
