import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Env } from '@/libs/Env';

import { withWebhookSecret } from './withWebhookSecret';

vi.mock('@/libs/Env', () => ({
  Env: {
    WEBHOOK_SECRET: 'test-webhook-secret-1234567890',
  },
}));

vi.mock('@/libs/api/errors', () => ({
  logAuthError: vi.fn(),
  unauthorizedError: vi.fn((msg?: string) =>
    new Response(JSON.stringify({ error: msg ?? 'Unauthorized' }), { status: 401 }),
  ),
  serviceUnavailableError: vi.fn((msg?: string) =>
    new Response(JSON.stringify({ error: msg ?? 'Service unavailable' }), { status: 503 }),
  ),
}));

describe('withWebhookSecret middleware', () => {
  const mockHandler = vi.fn(async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
  );

  function makeRequest(headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost:3009/api/webhooks/verify', {
      method: 'POST',
      headers,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when X-Webhook-Secret header is missing', async () => {
    const wrapped = withWebhookSecret(mockHandler);
    const response = await wrapped(makeRequest());

    expect(response.status).toBe(401);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('returns 401 when secret is invalid', async () => {
    const wrapped = withWebhookSecret(mockHandler);
    const response = await wrapped(makeRequest({ 'x-webhook-secret': 'wrong-secret' }));

    expect(response.status).toBe(401);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('calls handler when secret is valid', async () => {
    const wrapped = withWebhookSecret(mockHandler);
    const response = await wrapped(makeRequest({ 'x-webhook-secret': 'test-webhook-secret-1234567890' }));

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledOnce();
  });

  it('returns 503 when env var is not set', async () => {
    // Temporarily unset the secret
    const original = Env.WEBHOOK_SECRET;
    (Env as any).WEBHOOK_SECRET = undefined;

    const wrapped = withWebhookSecret(mockHandler);
    const response = await wrapped(makeRequest({ 'x-webhook-secret': 'anything' }));

    expect(response.status).toBe(503);
    expect(mockHandler).not.toHaveBeenCalled();

    (Env as any).WEBHOOK_SECRET = original;
  });
});
