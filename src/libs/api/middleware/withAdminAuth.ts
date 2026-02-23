/** @module withAdminAuth HOF -- wraps API route handlers with admin authentication. */

import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { forbiddenError, logAuthzError } from '@/libs/api/errors';
import { isAdmin } from '@/libs/auth/isAdmin';

import { withAuth } from './withAuth';

export type AdminHandler = (
  request: NextRequest,
  context: { user: User; params?: any },
) => Promise<Response>;

/**
 * Higher-order function that wraps an API route handler with admin authentication.
 *
 * Composes `withAuth()` with an admin role check. Logs authorization failures
 * and returns 403 Forbidden for non-admin users.
 *
 * @example
 * ```typescript
 * export const DELETE = withAdminAuth(async (request, { user, params }) => {
 *   const { userId } = params
 *   // `user` is guaranteed to be an admin
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withAdminAuth(handler: AdminHandler) {
  return withAuth(async (request, context) => {
    if (!isAdmin(context.user)) {
      logAuthzError('Admin access required', {
        endpoint: request.nextUrl?.pathname ?? 'unknown',
        method: request.method ?? 'unknown',
        userId: context.user.id,
      });
      return forbiddenError('Admin access required');
    }
    return handler(request, context);
  });
}
