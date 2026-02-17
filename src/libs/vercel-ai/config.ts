/**
 * Vercel AI SDK configuration
 *
 * Manages API keys and provider settings for the Vercel AI SDK integration.
 * Environment variables are server-side only - NEVER use NEXT_PUBLIC_ prefix.
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * Vercel AI SDK configuration object
 */
export type VercelAIConfig = {
  /**
   * OpenAI API key (server-side only)
   */
  openaiApiKey?: string;

  /**
   * Anthropic API key (server-side only)
   */
  anthropicApiKey?: string;

  /**
   * Active AI provider
   */
  provider: AIProvider;

  /**
   * Default model to use for chat
   */
  model: string;

  /**
   * Request timeout in milliseconds
   */
  timeout: number;
};

/**
 * Load configuration from environment variables
 *
 * Default provider: openai
 * Default model: gpt-4o-mini
 * Default timeout: 30000ms (30 seconds)
 */
export const VERCEL_AI_CONFIG: VercelAIConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  provider: (process.env.AI_PROVIDER as AIProvider) || 'openai',
  model: process.env.DEFAULT_AI_MODEL || 'gpt-4o-mini',
  timeout: 30000,
};

/**
 * Check if Vercel AI SDK is properly configured
 *
 * Validates that the required API key is available for the selected provider.
 *
 * @returns true if configured, false otherwise
 */
export function isConfigured(): boolean {
  const { provider, openaiApiKey, anthropicApiKey } = VERCEL_AI_CONFIG;

  if (provider === 'openai') {
    return !!openaiApiKey;
  }

  if (provider === 'anthropic') {
    return !!anthropicApiKey;
  }

  return false;
}

/**
 * Get the current provider name for logging/debugging
 */
export function getProviderName(): string {
  return VERCEL_AI_CONFIG.provider;
}

/**
 * Get the current model name for logging/debugging
 */
export function getModelName(): string {
  return VERCEL_AI_CONFIG.model;
}
