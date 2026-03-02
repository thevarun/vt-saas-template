/** @module withAuth HOF -- wraps API route handlers with authentication. */

import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { logAuthError, unauthorizedError } from '@/libs/api/errors';
import { createClient } from '@/libs/supabase/server';

export type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: User; params?: any },
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
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request, routeContext?: { params?: Promise<any> }) => {
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

    const params = routeContext?.params ? await routeContext.params : undefined;
    return handler(request as NextRequest, { user, params });
  };
}
