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
 * Create an AI provider instance for the configured provider
 *
 * @returns Language model instance from Vercel AI SDK
 * @throws Error if API key is not configured
 */
export async function createAIProvider(): Promise<LanguageModel> {
  const { provider, model, openaiApiKey, anthropicApiKey } = VERCEL_AI_CONFIG;

  if (!isConfigured()) {
    throw new Error(
      `AI provider "${provider}" is not configured. Missing API key in environment variables.`,
    );
  }

  if (provider === 'openai') {
    const openai = createOpenAI({
      apiKey: openaiApiKey,
    });
    return openai(model);
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
      return anthropic(model);
    } catch {
      throw new Error(
        `Anthropic provider requested but @ai-sdk/anthropic package not installed. Run: npm install @ai-sdk/anthropic`,
      );
    }
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
}
