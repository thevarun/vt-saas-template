/**
 * @module API error response builders for consistent error format.
 *
 * CANONICAL ERROR SHAPE (HTTP API responses, NOT Server Actions):
 *
 *   { error: string, code: ApiErrorCode, details?: object }
 *
 * Server Actions use a DIFFERENT shape — see `src/libs/actions/types.ts` ActionResult<T>:
 *
 *   { data: null, error: { message: string, code: ApiErrorCode } }
 *
 * Do not conflate the two. Client code calling HTTP routes uses `parseApiError` from
 * `src/libs/api/client/parseError.ts` which reads `json.error` (string) and `json.code`.
 * Client code calling Server Actions destructures `{ data, error }` and reads `error.message`.
 *
 * Drift detection: see Vitest snapshot in `responses.test.ts > canonical shape contract`.
 */

import { NextResponse } from 'next/server';

import type { ApiErrorCode, ApiErrorResponse, ValidationDetails } from './types';
import { HTTP_STATUS } from './types';

/** Create a standardized error response with the given message, code, status, and optional details. */
export function createErrorResponse(
  error: string,
  code: ApiErrorCode,
  status: number,
  details?: ValidationDetails | Record<string, unknown>,
  headers?: Record<string, string>,
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    code,
  };

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status, headers });
}

/** Returns 401 Unauthorized -- use when user is not authenticated. */
export function unauthorizedError(
  message = 'Authentication required',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'AUTH_REQUIRED', HTTP_STATUS.UNAUTHORIZED);
}

/** Returns 403 Forbidden -- use when user lacks permission. */
export function forbiddenError(
  message = 'You don\'t have permission to access this resource',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'FORBIDDEN', HTTP_STATUS.FORBIDDEN);
}

/** Returns 400 Bad Request with field-level validation error details. */
export function validationError(
  details: ValidationDetails | string,
  message = 'Validation failed',
): NextResponse<ApiErrorResponse> {
  const normalizedDetails: ValidationDetails = typeof details === 'string'
    ? { _error: [details] }
    : details;

  return createErrorResponse(
    message,
    'VALIDATION_ERROR',
    HTTP_STATUS.BAD_REQUEST,
    normalizedDetails,
  );
}

/** Returns 404 Not Found for the given resource name. */
export function notFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    `${resource} not found`,
    'NOT_FOUND',
    HTTP_STATUS.NOT_FOUND,
  );
}

/** Returns 409 Conflict -- use for duplicate unique fields or resource conflicts. */
export function conflictError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'CONFLICT', HTTP_STATUS.CONFLICT);
}

/** Returns 400 Bad Request -- use for malformed or missing required fields. */
export function invalidRequestError(
  message: string,
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'INVALID_REQUEST',
    HTTP_STATUS.BAD_REQUEST,
  );
}

/** Returns 500 Internal Server Error for database failures. */
export function dbError(
  message = 'Database operation failed',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'DB_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

/** Returns 500 Internal Server Error as a generic fallback. */
export function internalError(
  message = 'Internal server error',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'INTERNAL_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

/** Returns 500 Internal Server Error for Dify API failures. */
export function difyError(
  message = 'AI service unavailable',
  details?: Record<string, unknown>,
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'DIFY_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details,
  );
}

/** Returns 503 Service Unavailable -- use when a required service is not configured. */
export function serviceUnavailableError(
  message = 'Service temporarily unavailable',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'SERVICE_UNAVAILABLE',
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
}

/** Returns 408 Request Timeout -- use when a request exceeds time limit. */
export function timeoutError(
  message = 'Request timeout',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'TIMEOUT',
    HTTP_STATUS.REQUEST_TIMEOUT,
  );
}

/** Returns 429 Too Many Requests -- use when rate limit is exceeded. */
export function rateLimitError(
  message = 'Rate limit exceeded. Please try again later.',
  retryAfterSeconds = 60,
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'RATE_LIMIT',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    undefined,
    { 'Retry-After': String(retryAfterSeconds) },
  );
}

/** Returns 500 Internal Server Error with SAVE_FAILED code -- use when data persistence fails. */
export function saveFailedError(
  message = 'Failed to save data',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'SAVE_FAILED',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

/** Returns 409 Conflict with USERNAME_TAKEN code -- use when username is already taken. */
export function usernameTakenError(
  message = 'Username is already taken',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'USERNAME_TAKEN',
    HTTP_STATUS.CONFLICT,
  );
}

/** Returns 429 Too Many Requests when a user's quota is exhausted. */
export function quotaExhaustedError(resetsAt: Date): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    'Usage limit reached',
    'QUOTA_EXHAUSTED',
    HTTP_STATUS.TOO_MANY_REQUESTS,
    { resets_at: resetsAt.toISOString() },
  );
}

/**
 * Returns 410 Gone -- use when a resource has been permanently removed or expired.
 *
 * MIGRATION NOTE: expired/revoked share links previously returned 404 with
 * `code: 'NOT_FOUND'`. They now return 410 with `code: 'GONE'` (a more accurate
 * semantic for "existed but is no longer available"). Downstream forks that
 * branch on the error code client-side must audit any handler that checked for
 * `'NOT_FOUND'` on share-link responses and add a `'GONE'` branch.
 * `displayError.ts` maps `'GONE'` to a user-facing message.
 */
export function goneError(
  message = 'Resource is no longer available',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'GONE',
    HTTP_STATUS.GONE,
  );
}
