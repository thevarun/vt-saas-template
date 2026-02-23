/** @module LangFuse configuration -- optional observability for LLM tracing. */

export type LangfuseConfig = {
  publicKey?: string;
  secretKey?: string;
  host?: string;
};

export const LANGFUSE_CONFIG: LangfuseConfig = {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
};

/** Returns true if both public and secret keys are set. */
export function isConfigured(): boolean {
  return !!(LANGFUSE_CONFIG.publicKey && LANGFUSE_CONFIG.secretKey);
}
