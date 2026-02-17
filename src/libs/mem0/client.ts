/**
 * Mem0 Client Singleton
 *
 * This module provides a singleton instance of the Mem0 MemoryClient.
 * The client is lazily initialized on first use and returns null when disabled.
 *
 * Graceful Degradation:
 * - When Mem0 is disabled, all functions return null/false gracefully
 * - No errors are thrown, chat continues without memory features
 * - A single info log message is emitted per app lifecycle
 *
 * Usage:
 * ```typescript
 * const client = getMem0Client();
 * if (client) {
 *   // Mem0 is enabled, use client
 * }
 * ```
 *
 * @see {@link https://mem0.ai/docs/api-reference Mem0 API Reference}
 */

import { MemoryClient } from 'mem0ai';

import { logger } from '@/libs/Logger';

import { isEnabled, MEM0_CONFIG } from './config';

let mem0Client: MemoryClient | null = null;
let disabledWarningLogged = false;

/**
 * Get Mem0 client instance (singleton pattern).
 *
 * Returns null if Mem0 is disabled or initialization fails.
 * The client is created lazily on first access and reused for subsequent calls.
 *
 * @returns MemoryClient instance or null if disabled
 */
export function getMem0Client(): MemoryClient | null {
  if (!isEnabled()) {
    if (!disabledWarningLogged) {
      logger.info('Mem0 disabled - skipping memory features');
      disabledWarningLogged = true;
    }
    return null;
  }

  if (!mem0Client) {
    try {
      mem0Client = new MemoryClient({
        apiKey: MEM0_CONFIG.apiKey!,
      });
      logger.info('Mem0 client initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Mem0 client');
      return null;
    }
  }

  return mem0Client;
}

/**
 * Check if Mem0 is enabled
 *
 * Helper function for conditional logic in calling code.
 *
 * @returns true if Mem0 is properly configured and enabled
 */
export function isMem0Enabled(): boolean {
  return isEnabled();
}
