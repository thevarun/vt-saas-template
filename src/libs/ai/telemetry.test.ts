import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Env', () => ({
  Env: {
    LANGFUSE_TRACING_ENVIRONMENT: undefined as string | undefined,
    LANGFUSE_PUBLIC_KEY: 'pk-test' as string | undefined,
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

type MockEnv = {
  LANGFUSE_TRACING_ENVIRONMENT: string | undefined;
  LANGFUSE_PUBLIC_KEY: string | undefined;
};

describe('buildTelemetry', () => {
  beforeEach(async () => {
    const { Env } = await import('@/libs/Env');
    (Env as unknown as MockEnv).LANGFUSE_TRACING_ENVIRONMENT = undefined;
    (Env as unknown as MockEnv).LANGFUSE_PUBLIC_KEY = 'pk-test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns isEnabled + functionId + metadata.userId when Langfuse is configured', async () => {
    const { buildTelemetry } = await import('./telemetry');

    const telemetry = buildTelemetry('generate-draft', 'user-1');

    expect(telemetry.isEnabled).toBe(true);
    expect(telemetry.functionId).toBe('generate-draft');
    expect(telemetry.metadata?.userId).toBe('user-1');
  });

  it('disables telemetry when no Langfuse public key is configured', async () => {
    const { Env } = await import('@/libs/Env');
    (Env as unknown as MockEnv).LANGFUSE_PUBLIC_KEY = undefined;

    const { buildTelemetry } = await import('./telemetry');

    expect(buildTelemetry('fn', 'user-1').isEnabled).toBe(false);
  });

  it('includes sessionId only when passed', async () => {
    const { buildTelemetry } = await import('./telemetry');

    expect(buildTelemetry('fn', 'user-1').metadata).not.toHaveProperty('sessionId');
    expect(buildTelemetry('fn', 'user-1', 'sess-9').metadata?.sessionId).toBe('sess-9');
  });

  it('includes environment only when LANGFUSE_TRACING_ENVIRONMENT is set', async () => {
    const { Env } = await import('@/libs/Env');

    const { buildTelemetry } = await import('./telemetry');

    expect(buildTelemetry('fn', 'user-1').metadata).not.toHaveProperty('environment');

    (Env as unknown as MockEnv).LANGFUSE_TRACING_ENVIRONMENT = 'staging';

    expect(buildTelemetry('fn', 'user-1').metadata?.environment).toBe('staging');
  });
});

describe('withStageTimer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the fn result and logs start + complete on success', async () => {
    const { logger } = await import('@/libs/Logger');

    const { withStageTimer } = await import('./telemetry');

    const result = await withStageTimer(
      { stage: 'fetch', userId: 'u1', requestId: 'r1' },
      async () => 'ok',
    );

    expect(result).toBe('ok');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'fetch' }),
      'pipeline: fetch started',
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'fetch', durationMs: expect.any(Number) }),
      'pipeline: fetch completed',
    );
  });

  it('logs the error and re-throws on failure', async () => {
    const { logger } = await import('@/libs/Logger');

    const { withStageTimer } = await import('./telemetry');

    const boom = new Error('boom');

    await expect(
      withStageTimer({ stage: 'fail', userId: 'u1', requestId: 'r1' }, async () => {
        throw boom;
      }),
    ).rejects.toThrow('boom');

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'fail', error: boom }),
      'pipeline: fail failed',
    );
  });
});
