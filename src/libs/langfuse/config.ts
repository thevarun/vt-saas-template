/** @module LangFuse configuration -- optional observability for LLM tracing. */

import { Env } from '@/libs/Env';

export type LangfuseConfig = {
  publicKey?: string;
  secretKey?: string;
  host?: string;
};

export const LANGFUSE_CONFIG: LangfuseConfig = {
  publicKey: Env.LANGFUSE_PUBLIC_KEY,
  secretKey: Env.LANGFUSE_SECRET_KEY,
  host: Env.LANGFUSE_HOST,
};

/** Returns true if both public and secret keys are set. */
export function isConfigured(): boolean {
  return !!(LANGFUSE_CONFIG.publicKey && LANGFUSE_CONFIG.secretKey);
}
