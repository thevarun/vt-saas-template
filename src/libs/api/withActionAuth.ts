import * as Sentry from '@sentry/nextjs';
import type { User } from '@supabase/supabase-js';

import { getCachedUser } from '@/libs/supabase/cached-user';

import type { ActionResult } from '../actions/types';

// Inferred client type from `getCachedUser` — the request-scoped server client
// returned alongside the authenticated user. Callers query tables via `.from()`.
type ServerSupabaseClient = Awaited<ReturnType<typeof getCachedUser>>['supabase'];

/**
 * Context passed to wrapped Server Action handlers.
 * - `user` is guaranteed non-null inside the handler
 * - `supabase` is the request-scoped server client (same instance the auth check used)
 */
export type ActionAuthContext = {
  user: User;
  supabase: ServerSupabaseClient;
};

/**
 * Wraps a Server Action body with cached-user auth and the standard
 * UNAUTHORIZED early return. The wrapped fn takes only `input`.
 *
 * Usage:
 *   export const deletePost = withActionAuth(async ({ user, supabase }, input: unknown) => {
 *     // ... action body, with `user` and `supabase` already provided
 *   });
 */
export function withActionAuth<TInput, TOutput>(
  handler: (ctx: ActionAuthContext, input: TInput) => Promise<ActionResult<TOutput>>,
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput) => {
    const { user, error: authError, supabase } = await getCachedUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    }
    Sentry.setUser({ id: user.id });
    return handler({ user, supabase }, input);
  };
}

/**
 * Variant for actions that take NO input. Avoids forcing callers to pass `undefined`.
 *
 * Usage:
 *   export const getMe = withActionAuthNoInput(async ({ user }) => { ... });
 */
export function withActionAuthNoInput<TOutput>(
  handler: (ctx: ActionAuthContext) => Promise<ActionResult<TOutput>>,
): () => Promise<ActionResult<TOutput>> {
  return async () => {
    const { user, error: authError, supabase } = await getCachedUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
    }
    Sentry.setUser({ id: user.id });
    return handler({ user, supabase });
  };
}
