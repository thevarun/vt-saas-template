/**
 * Shared types for Server Actions.
 *
 * All Server Actions must return ActionResult<T> per architecture rules.
 *
 * Note the shape differs from the canonical HTTP error response
 * (`{ error: string, code: ApiErrorCode, details? }` — see
 * `src/libs/api/errors/responses.ts`). Server Actions nest the message and code
 * under `error`: `{ data: null, error: { message, code } }`.
 */

import type { ApiErrorCode } from '@/libs/api/errors';

export type ActionResult<T>
  = { data: T; error: null }
    | { data: null; error: { message: string; code: ApiErrorCode } };
