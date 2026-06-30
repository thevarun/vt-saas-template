/**
 * Vercel AI SDK client initialization
 *
 * Provides functions to create AI provider instances for streaming chat.
 * Supports OpenAI and Anthropic providers.
 */

import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

import { isConfigured, VERCEL_AI_CONFIG } from './config';

/**
 * Resolves a `LanguageModel` for the given model id through the configured
 * provider. Single-sources the provider-selection logic shared by
 * {@link createAIProvider} (env-default model) and {@link createAIModel}
 * (caller-supplied, e.g. quota-resolved model id).
 *
 * @throws Error if the provider's API key is not configured
 */
async function resolveProvider(modelId: string): Promise<LanguageModel> {
  const { provider, openaiApiKey, anthropicApiKey } = VERCEL_AI_CONFIG;

  if (!isConfigured()) {
    throw new Error(
      `AI provider "${provider}" is not configured. Missing API key in environment variables.`,
    );
  }

  if (provider === 'openai') {
    const openai = createOpenAI({
      apiKey: openaiApiKey,
    });
    return openai(modelId);
  }

  if (provider === 'anthropic') {
    // Lazy load Anthropic to avoid requiring the package if not used
    try {
      // Dynamic ESM import for optional dependency
      // @ts-expect-error - @ai-sdk/anthropic is an optional dependency
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({
        apiKey: anthropicApiKey,
      });
      return anthropic(modelId);
    } catch {
      throw new Error(
        `Anthropic provider requested but @ai-sdk/anthropic package not installed. Run: npm install @ai-sdk/anthropic`,
      );
    }
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}

/**
 * Create an AI provider instance for the configured provider, using the
 * env-default model (`DEFAULT_AI_MODEL`).
 *
 * @returns Language model instance from Vercel AI SDK
 * @throws Error if API key is not configured
 */
export async function createAIProvider(): Promise<LanguageModel> {
  return resolveProvider(VERCEL_AI_CONFIG.model);
}

/**
 * Create an AI provider instance for a caller-supplied model id, routed through
 * the same provider path as {@link createAIProvider}. Use with a quota-resolved
 * model id (see `src/libs/ai/quota.ts`) to gate AI calls per user/tier.
 *
 * @param modelId - The model id to instantiate (e.g. from `getModelForUser`)
 * @returns Language model instance from Vercel AI SDK
 * @throws Error if API key is not configured
 */
export async function createAIModel(modelId: string): Promise<LanguageModel> {
  return resolveProvider(modelId);
}
