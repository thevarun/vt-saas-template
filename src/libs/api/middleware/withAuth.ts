/** @module withAuth HOF -- wraps API route handlers with authentication. */

import * as Sentry from '@sentry/nextjs';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logAuthError, unauthorizedError } from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

// Parameterise `params` so dynamic-route handlers can declare the expected
// shape (e.g. `{ id: string }`) instead of accepting `any`. The default keeps
// the previous behaviour intact for routes that omit the generic.
export type AuthenticatedHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: { user: User; params?: P },
) => Promise<Response>;

/**
 * Higher-order function that wraps an API route handler with authentication.
 *
 * Handles Supabase session validation, logs auth failures, and passes the
 * authenticated `User` plus awaited route params to the inner handler.
 *
 * Accepts both `Request` and `NextRequest` — Next.js passes `NextRequest` at
 * runtime; plain `Request` is accepted for testability.
 *
 * @example
 * ```typescript
 * export const POST = withAuth(async (request, { user, params }) => {
 *   // `user` is guaranteed to be a valid Supabase User
 *   return NextResponse.json({ userId: user.id })
 * })
 * ```
 */
export function withAuth<P = Record<string, string>>(handler: AuthenticatedHandler<P>) {
  return async (request: Request, routeContext?: { params?: Promise<P> }) => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logAuthError('Invalid session', {
        endpoint: (request as NextRequest).nextUrl?.pathname ?? 'unknown',
        method: request.method ?? 'unknown',
      });
      return unauthorizedError();
    }

    // Attach user to the request's Sentry scope so any captureException within
    // this request (direct or via logApiError) carries user context.
    Sentry.setUser({ id: user.id });

    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(request as NextRequest, { user, params });
  };
}
