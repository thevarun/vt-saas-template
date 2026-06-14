/** @module AI telemetry helpers — builds Vercel AI SDK telemetry config with Langfuse metadata. */

import type { TelemetrySettings } from 'ai';

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

/**
 * Builds the `experimental_telemetry` config for AI SDK calls.
 * Attaches userId and an optional sessionId so Langfuse can attribute traces
 * to users and group related calls (e.g. a multi-step conversation).
 */
export function buildTelemetry(
  functionId: string,
  userId: string,
  sessionId?: string,
): TelemetrySettings {
  return {
    isEnabled: true,
    functionId,
    metadata: {
      userId,
      ...(sessionId && { sessionId }),
      ...(Env.LANGFUSE_TRACING_ENVIRONMENT && {
        environment: Env.LANGFUSE_TRACING_ENVIRONMENT,
      }),
    },
  };
}

/**
 * Wraps a non-LLM pipeline stage in a timing/logging span.
 *
 * - Logs entry with `{ stage, userId, requestId, ...extra }`.
 * - On success: logs `{ stage, durationMs, ...extra }` at info level.
 * - On failure: logs `{ stage, durationMs, error, ...extra }` at error level and re-throws.
 *
 * Future-proof: when wiring Langfuse manual spans, this wrapper becomes
 * the natural extension point.
 */
export async function withStageTimer<T>(
  args: { stage: string; userId: string; requestId: string; extra?: Record<string, unknown> },
  fn: () => Promise<T>,
): Promise<T> {
  const { stage, userId, requestId, extra } = args;
  const startedAt = performance.now();
  logger.info({ stage, userId, requestId, ...extra }, `pipeline: ${stage} started`);

  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - startedAt);
    logger.info(
      { stage, userId, requestId, durationMs, ...extra },
      `pipeline: ${stage} completed`,
    );
    return result;
  } catch (err) {
    const durationMs = Math.round(performance.now() - startedAt);
    logger.error(
      { stage, userId, requestId, durationMs, error: err, ...extra },
      `pipeline: ${stage} failed`,
    );
    throw err;
  }
}
