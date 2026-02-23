/** @module Mem0 client singleton -- lazily initialized, returns null when disabled. */

import { MemoryClient } from 'mem0ai';

import { logger } from '@/libs/Logger';

import { isEnabled, MEM0_CONFIG } from './config';

let mem0Client: MemoryClient | null = null;
let disabledWarningLogged = false;

/** Get Mem0 client instance (singleton). Returns null if disabled or initialization fails. */
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
