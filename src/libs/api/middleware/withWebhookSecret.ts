/** @module withWebhookSecret HOF -- wraps API route handlers with webhook secret authentication. */

import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';

import type { NextRequest } from 'next/server';

import { logAuthError, serviceUnavailableError, unauthorizedError } from '@/libs/api/errors';
import { Env } from '@/libs/Env';

// Parameterise `params` so dynamic-route handlers can declare the expected
// shape (e.g. `{ id: string }`) instead of accepting `any`.
export type WebhookHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: { params?: P },
) => Promise<Response>;

/**
 * Higher-order function that wraps an API route handler with webhook secret authentication.
 *
 * Validates the `X-Webhook-Secret` header against the `WEBHOOK_SECRET` env var
 * using a timing-safe comparison. Returns 503 when the secret is unconfigured
 * so inbound webhooks degrade gracefully rather than appearing authenticated.
 */
export function withWebhookSecret<P = Record<string, string>>(handler: WebhookHandler<P>) {
  return async (request: NextRequest, routeContext?: { params?: Promise<P> }) => {
    const secret = Env.WEBHOOK_SECRET;

    if (!secret) {
      return serviceUnavailableError('Webhook secret not configured');
    }

    const headerSecret = request.headers.get('x-webhook-secret');

    if (!headerSecret) {
      logAuthError('Missing X-Webhook-Secret header', {
        endpoint: request.nextUrl?.pathname ?? 'unknown',
        method: request.method ?? 'unknown',
      });
      return unauthorizedError('Webhook secret required');
    }

    // Timing-safe comparison to prevent timing attacks
    const expected = Buffer.from(secret, 'utf8');
    const received = Buffer.from(headerSecret, 'utf8');

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      logAuthError('Invalid webhook secret', {
        endpoint: request.nextUrl?.pathname ?? 'unknown',
        method: request.method ?? 'unknown',
      });
      return unauthorizedError('Invalid webhook secret');
    }

    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(request, { params });
  };
}
