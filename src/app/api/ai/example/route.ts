/**
 * POST /api/ai/example
 *
 * Canonical example of a quota-gated AI route. Demonstrates the full chain every
 * paid AI feature needs, using the provider-agnostic client and the two-pool
 * quota framework:
 *
 *   getModelForUser  → quotaExhaustedError on exhaustion
 *                    → createAIModel + generateText
 *                    → recordUsage → invalidateQuotaCache
 *
 * Copy this pattern for real routes; swap the generic `{ prompt }` body and
 * plain `generateText` call for your feature's schema and prompt builder.
 *
 * Body: { prompt: string }
 *
 * Requires authentication (withAuth). Rate-limited per user.
 */

import { generateText } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { SMART_RESOURCE_TYPE } from '@/libs/ai/config';
import { getModelForUser } from '@/libs/ai/quota';
import { buildTelemetry } from '@/libs/ai/telemetry';
import {
  internalError,
  invalidRequestError,
  quotaExhaustedError,
  rateLimitError,
  validationError,
} from '@/libs/api/errors';
import { withAuth } from '@/libs/api/middleware/withAuth';
import { checkRateLimit } from '@/libs/api/rateLimit';
import { logger } from '@/libs/Logger';
import { invalidateQuotaCache } from '@/libs/subscriptions/quota';
import { recordUsage } from '@/libs/subscriptions/usage';
import { createAIModel } from '@/libs/vercel-ai/client';
import { isConfigured } from '@/libs/vercel-ai/config';

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const requestBodySchema = z.object({
  prompt: z.string().trim().min(1).max(10000),
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `ai-example:${user.id}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS,
  );

  if (!allowed) {
    return rateLimitError(
      'Rate limit exceeded. Please try again later.',
      retryAfterSeconds,
    );
  }

  if (!isConfigured()) {
    return invalidRequestError(
      'AI is not configured. Please set up OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables.',
    );
  }

  // Parse the body OUTSIDE the try below so a malformed (non-JSON) body is a 400
  // client error, not a logged 500 server fault. The try only wraps the AI call,
  // whose failures genuinely are 5xx.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return invalidRequestError('Invalid JSON body');
  }

  const parsed = requestBodySchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const { prompt } = parsed.data;

  try {
    // Quota check before the AI call.
    const selection = await getModelForUser(user, SMART_RESOURCE_TYPE);
    if (!selection.allowed) {
      return quotaExhaustedError(selection.resetsAt);
    }

    const model = await createAIModel(selection.modelId);
    const result = await generateText({
      model,
      prompt,
      experimental_telemetry: buildTelemetry('ai-example', user.id),
    });

    // Record usage against the resolved pool, then invalidate the quota cache so
    // the next check reads fresh counts.
    const totalTokens = result.usage?.totalTokens ?? 0;
    await recordUsage(user.id, SMART_RESOURCE_TYPE, selection.modelId, totalTokens, selection.premiumModelId);
    invalidateQuotaCache(user.id, SMART_RESOURCE_TYPE);

    return Response.json({
      text: result.text,
      usage_warning: selection.warning ?? null,
      model_downgrade: selection.downgrade ?? null,
    });
  } catch (error) {
    logger.error({ error }, 'ai-example: failed to generate text');
    return internalError('Failed to generate text');
  }
});
