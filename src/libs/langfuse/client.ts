/**
 * LangFuse client initialization
 *
 * Provides singleton access to the LangFuse client for LLM observability.
 * The client is initialized on-demand and cached for the app lifecycle.
 *
 * Graceful Degradation:
 * - If LangFuse is not configured, returns null without throwing
 * - Logs warning message once per app lifecycle
 * - Chat functionality works normally without LangFuse
 *
 * Usage:
 * ```typescript
 * import { getLangfuseClient, isLangfuseConfigured } from '@/libs/langfuse/client';
 *
 * if (isLangfuseConfigured()) {
 *   const langfuse = getLangfuseClient();
 *   // Use langfuse client...
 * }
 * ```
 *
 * @see {@link https://langfuse.com/docs/sdk/typescript Langfuse TypeScript SDK}
 */

import { Langfuse } from 'langfuse';

import { logger } from '@/libs/Logger';

import { isConfigured, LANGFUSE_CONFIG } from './config';

let langfuseClient: Langfuse | null = null;
let configWarningLogged = false;

/**
 * Get or create the singleton LangFuse client
 *
 * Returns null if LangFuse is not configured (graceful degradation).
 * Logs a warning message once per app lifecycle when not configured.
 *
 * @returns LangFuse client instance or null if not configured
 */
export function getLangfuseClient(): Langfuse | null {
  if (!isConfigured()) {
    if (!configWarningLogged) {
      logger.warn('LangFuse not configured - skipping LLM tracing');
      configWarningLogged = true;
    }
    return null;
  }

  if (!langfuseClient) {
    try {
      langfuseClient = new Langfuse({
        publicKey: LANGFUSE_CONFIG.publicKey!,
        secretKey: LANGFUSE_CONFIG.secretKey!,
        baseUrl: LANGFUSE_CONFIG.host,
      });

      logger.info('LangFuse client initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize LangFuse client');
      return null;
    }
  }

  return langfuseClient;
}

/**
 * Check if LangFuse is configured
 *
 * Convenience wrapper around config.isConfigured()
 *
 * @returns true if LangFuse is properly configured
 */
export function isLangfuseConfigured(): boolean {
  return isConfigured();
}

/**
 * Flush pending traces to LangFuse
 *
 * Should be called before serverless functions terminate
 * to ensure traces are sent.
 *
 * @returns Promise that resolves when flush is complete
 */
export async function flushLangfuse(): Promise<void> {
  const client = getLangfuseClient();
  if (client) {
    try {
      await client.flushAsync();
    } catch (error) {
      logger.error({ error }, 'Failed to flush LangFuse traces');
    }
  }
}
