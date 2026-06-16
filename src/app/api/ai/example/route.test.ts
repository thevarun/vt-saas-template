// @vitest-environment node
/**
 * Tests for POST /api/ai/example — the canonical quota-gated AI route.
 *
 * Asserts the full chain: getModelForUser → quotaExhaustedError on exhaustion →
 * createAIModel + generateText → recordUsage → invalidateQuotaCache, plus the
 * not-configured and invalid-body guards.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted factories
// ---------------------------------------------------------------------------
const {
  mockSupabaseUser,
  mockGetUser,
  mockCreateClient,
  mockCookies,
  mockGetModelForUser,
  mockCreateAIModel,
  mockGenerateText,
  mockRecordUsage,
  mockInvalidateQuota,
  mockBuildTelemetry,
  mockCheckRateLimit,
  mockIsConfigured,
} = vi.hoisted(() => {
  const mockSupabaseUser = { id: 'user-test-123', email: 'test@test.com' };
  const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };

  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });
  const mockCreateClient = vi.fn().mockReturnValue({ auth: { getUser: mockGetUser } });
  const mockCookies = vi.fn().mockResolvedValue(mockCookieStore);

  const mockGetModelForUser = vi.fn().mockResolvedValue({
    allowed: true,
    modelId: 'gpt-4o',
    premiumModelId: 'gpt-4o',
    usagePct: { premium: 0, fallback: 0 },
    resetsAt: new Date('2026-07-01T00:00:00Z'),
  });
  const mockCreateAIModel = vi.fn().mockResolvedValue('mock-model');
  const mockGenerateText = vi.fn().mockResolvedValue({
    text: 'generated output',
    usage: { totalTokens: 42 },
  });
  const mockRecordUsage = vi.fn().mockResolvedValue(undefined);
  const mockInvalidateQuota = vi.fn();
  const mockBuildTelemetry = vi.fn().mockReturnValue({ isEnabled: false });
  const mockCheckRateLimit = vi.fn().mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
  const mockIsConfigured = vi.fn().mockReturnValue(true);

  return {
    mockSupabaseUser,
    mockGetUser,
    mockCreateClient,
    mockCookies,
    mockGetModelForUser,
    mockCreateAIModel,
    mockGenerateText,
    mockRecordUsage,
    mockInvalidateQuota,
    mockBuildTelemetry,
    mockCheckRateLimit,
    mockIsConfigured,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/headers', () => ({ cookies: mockCookies }));
vi.mock('@/libs/supabase/server', () => ({ createClient: mockCreateClient }));
vi.mock('ai', () => ({ generateText: mockGenerateText }));
vi.mock('@/libs/ai/quota', () => ({ getModelForUser: mockGetModelForUser }));
vi.mock('@/libs/ai/config', () => ({ SMART_RESOURCE_TYPE: 'smart_generation', FAST_RESOURCE_TYPE: 'fast_generation' }));
vi.mock('@/libs/ai/telemetry', () => ({ buildTelemetry: mockBuildTelemetry }));
vi.mock('@/libs/vercel-ai/client', () => ({ createAIModel: mockCreateAIModel }));
vi.mock('@/libs/vercel-ai/config', () => ({ isConfigured: mockIsConfigured }));
vi.mock('@/libs/subscriptions/quota', () => ({ invalidateQuotaCache: mockInvalidateQuota }));
vi.mock('@/libs/subscriptions/usage', () => ({ recordUsage: mockRecordUsage }));
vi.mock('@/libs/api/rateLimit', () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  const req = new Request('http://localhost:3000/api/ai/example', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  Object.defineProperty(req, 'nextUrl', { value: { pathname: '/api/ai/example' } });
  return req;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/ai/example', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue({ get: vi.fn(), set: vi.fn(), delete: vi.fn() });
    mockGetUser.mockResolvedValue({ data: { user: mockSupabaseUser }, error: null });
    mockCreateClient.mockReturnValue({ auth: { getUser: mockGetUser } });
    mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterSeconds: 0 });
    mockIsConfigured.mockReturnValue(true);
    mockGetModelForUser.mockResolvedValue({
      allowed: true,
      modelId: 'gpt-4o',
      premiumModelId: 'gpt-4o',
      usagePct: { premium: 0, fallback: 0 },
      resetsAt: new Date('2026-07-01T00:00:00Z'),
    });
    mockCreateAIModel.mockResolvedValue('mock-model');
    mockGenerateText.mockResolvedValue({ text: 'generated output', usage: { totalTokens: 42 } });
  });

  it('returns 429 QUOTA_EXHAUSTED shape when quota is exhausted', async () => {
    mockGetModelForUser.mockResolvedValueOnce({
      allowed: false,
      modelId: 'gpt-4o-mini',
      premiumModelId: 'gpt-4o',
      usagePct: { premium: 100, fallback: 100 },
      resetsAt: new Date('2026-07-01T00:00:00Z'),
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ prompt: 'hello' }) as any);

    expect(res.status).toBe(429);

    const body = await res.json();

    expect(body).toMatchObject({
      error: 'Usage limit reached',
      code: 'QUOTA_EXHAUSTED',
      details: { resets_at: '2026-07-01T00:00:00.000Z' },
    });

    // No AI call or usage recording when gated.
    expect(mockCreateAIModel).not.toHaveBeenCalled();
    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(mockRecordUsage).not.toHaveBeenCalled();
  });

  it('records usage with the resolved model + premium ids and returns text on the happy path', async () => {
    mockGetModelForUser.mockResolvedValueOnce({
      allowed: true,
      modelId: 'gpt-4o',
      premiumModelId: 'gpt-4o',
      usagePct: { premium: 10, fallback: 0 },
      warning: { type: 'approaching_premium_limit', usage_pct: 92, resets_at: new Date('2026-07-01T00:00:00Z') },
      downgrade: { reason: 'premium_exhausted', current_model: 'gpt-4o-mini', resets_at: new Date('2026-07-01T00:00:00Z') },
      resetsAt: new Date('2026-07-01T00:00:00Z'),
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ prompt: 'hello' }) as any);

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.text).toBe('generated output');
    expect(body.usage_warning).toMatchObject({ type: 'approaching_premium_limit', usage_pct: 92 });
    expect(body.model_downgrade).toMatchObject({ reason: 'premium_exhausted', current_model: 'gpt-4o-mini' });

    expect(mockCreateAIModel).toHaveBeenCalledWith('gpt-4o');
    expect(mockRecordUsage).toHaveBeenCalledWith('user-test-123', 'smart_generation', 'gpt-4o', 42, 'gpt-4o');
    expect(mockInvalidateQuota).toHaveBeenCalledWith('user-test-123', 'smart_generation');
  });

  it('returns 400 INVALID_REQUEST when AI is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ prompt: 'hello' }) as any);

    expect(res.status).toBe(400);

    const body = await res.json();

    expect(body.code).toBe('INVALID_REQUEST');
    expect(mockGetModelForUser).not.toHaveBeenCalled();
  });

  it('returns 400 VALIDATION_ERROR on an invalid body', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ prompt: '' }) as any);

    expect(res.status).toBe(400);

    const body = await res.json();

    expect(body.code).toBe('VALIDATION_ERROR');
    expect(mockCreateAIModel).not.toHaveBeenCalled();
  });

  it('returns 400 INVALID_REQUEST on a malformed JSON body (not a logged 500)', async () => {
    const { logger } = await import('@/libs/Logger');
    const { POST } = await import('./route');
    // A non-JSON string body makes req.json() throw — a client error, so it must
    // be a 400, not the generic internalError 500 that would inflate error rate.
    const res = await POST(makeRequest('}{ not json') as any);

    expect(res.status).toBe(400);

    const body = await res.json();

    expect(body.code).toBe('INVALID_REQUEST');
    expect(mockGetModelForUser).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockReturnValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('no session') }) },
    });

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ prompt: 'hello' }) as any);

    expect(res.status).toBe(401);
  });
});
