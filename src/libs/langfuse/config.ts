/**
 * LangFuse configuration
 *
 * Manages LangFuse environment variables and configuration validation.
 * LangFuse is an optional observability platform for LLM tracing.
 *
 * Environment Variables:
 * - LANGFUSE_PUBLIC_KEY: Public API key from LangFuse dashboard
 * - LANGFUSE_SECRET_KEY: Secret API key (keep server-side only)
 * - LANGFUSE_HOST: Optional custom host (defaults to cloud.langfuse.com)
 *
 * @see {@link https://langfuse.com/docs LangFuse Documentation}
 */

export type LangfuseConfig = {
  publicKey?: string;
  secretKey?: string;
  host?: string;
};

/**
 * LangFuse configuration loaded from environment variables
 *
 * IMPORTANT: These keys must NEVER use NEXT_PUBLIC_ prefix.
 * They should remain server-side only.
 */
export const LANGFUSE_CONFIG: LangfuseConfig = {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  host: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
};

/**
 * Check if LangFuse is properly configured
 *
 * @returns true if both public and secret keys are set
 */
export function isConfigured(): boolean {
  return !!(LANGFUSE_CONFIG.publicKey && LANGFUSE_CONFIG.secretKey);
}
