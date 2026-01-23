/**
 * API Error Response Builders
 *
 * Centralized utilities for creating consistent error responses across all API endpoints.
 * These functions ensure all errors follow the standard format: { error, code, details? }
 *
 * @see /docs/api-error-handling.md for usage guide
 */

import { NextResponse } from 'next/server';

import type { ApiErrorCode, ApiErrorResponse } from './types';
import { HTTP_STATUS } from './types';

/**
 * Creates a standardized error response
 *
 * @param error - Human-readable error message
 * @param code - Machine-readable error code
 * @param status - HTTP status code
 * @param details - Optional additional context (validation errors, debug info)
 * @returns NextResponse with error payload
 *
 * @example
 * ```typescript
 * return createErrorResponse(
 *   'Invalid input',
 *   'VALIDATION_ERROR',
 *   400,
 *   { field: 'conversationId', message: 'Required' }
 * );
 * ```
 */
export function createErrorResponse(
  error: string,
  code: ApiErrorCode,
  status: number,
  details?: Record<string, any>,
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error,
    code,
  };

  // Only include details if provided
  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Returns 401 Unauthorized error
 *
 * Use when the user is not authenticated (missing or invalid session).
 *
 * @param message - Optional custom message (default: "Authentication required")
 * @returns NextResponse with 401 status
 *
 * @example
 * ```typescript
 * const { user, error } = await supabase.auth.getUser();
 * if (error || !user) {
 *   return unauthorizedError();
 * }
 * ```
 */
export function unauthorizedError(
  message = 'Authentication required',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'AUTH_REQUIRED', HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Returns 403 Forbidden error
 *
 * Use when the user is authenticated but lacks permission for the resource.
 *
 * @param message - Optional custom message (default: "You don't have permission to access this resource")
 * @returns NextResponse with 403 status
 *
 * @example
 * ```typescript
 * if (thread.user_id !== user.id) {
 *   return forbiddenError('You can only modify your own threads');
 * }
 * ```
 */
export function forbiddenError(
  message = 'You don\'t have permission to access this resource',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'FORBIDDEN', HTTP_STATUS.FORBIDDEN);
}

/**
 * Returns 400 Bad Request with validation errors
 *
 * Use when input validation fails. Includes field-level details for form display.
 *
 * @param details - Validation error details (typically from Zod)
 * @param message - Optional custom message (default: "Validation failed")
 * @returns NextResponse with 400 status
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(body);
 * if (!result.success) {
 *   return validationError(result.error.errors);
 * }
 * ```
 */
export function validationError(
  details: any,
  message = 'Validation failed',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'VALIDATION_ERROR',
    HTTP_STATUS.BAD_REQUEST,
    details,
  );
}

/**
 * Returns 404 Not Found error
 *
 * Use when a requested resource does not exist.
 *
 * @param resource - Name of the resource (e.g., "Thread", "User")
 * @returns NextResponse with 404 status
 *
 * @example
 * ```typescript
 * const thread = await getThread(id);
 * if (!thread) {
 *   return notFoundError('Thread');
 * }
 * ```
 */
export function notFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    `${resource} not found`,
    'NOT_FOUND',
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Returns 409 Conflict error
 *
 * Use when there's a resource conflict (e.g., duplicate unique field).
 *
 * @param message - Specific conflict message
 * @returns NextResponse with 409 status
 *
 * @example
 * ```typescript
 * if (dbError.message?.includes('duplicate')) {
 *   return conflictError('Thread with this conversation ID already exists');
 * }
 * ```
 */
export function conflictError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 'CONFLICT', HTTP_STATUS.CONFLICT);
}

/**
 * Returns 400 Bad Request for invalid requests
 *
 * Use when the request is malformed or missing required fields.
 *
 * @param message - Specific error message
 * @returns NextResponse with 400 status
 *
 * @example
 * ```typescript
 * if (!body.conversationId) {
 *   return invalidRequestError('Conversation ID is required');
 * }
 * ```
 */
export function invalidRequestError(
  message: string,
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'INVALID_REQUEST',
    HTTP_STATUS.BAD_REQUEST,
  );
}

/**
 * Returns 500 Internal Server Error for database errors
 *
 * Use when a database operation fails unexpectedly.
 *
 * @param message - Optional custom message (default: "Database operation failed")
 * @returns NextResponse with 500 status
 *
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('threads').select();
 * if (error) {
 *   logger.error({ error }, 'Failed to fetch threads');
 *   return dbError();
 * }
 * ```
 */
export function dbError(
  message = 'Database operation failed',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'DB_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

/**
 * Returns 500 Internal Server Error for unexpected errors
 *
 * Use as a fallback for unhandled exceptions.
 *
 * @param message - Optional custom message (default: "Internal server error")
 * @returns NextResponse with 500 status
 *
 * @example
 * ```typescript
 * try {
 *   // ... business logic
 * } catch (error) {
 *   logger.error({ error }, 'Unexpected error');
 *   return internalError();
 * }
 * ```
 */
export function internalError(
  message = 'Internal server error',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'INTERNAL_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

/**
 * Returns 500 Internal Server Error for Dify API errors
 *
 * Use when the external Dify API fails.
 *
 * @param message - Optional custom message (default: "AI service unavailable")
 * @param details - Optional error details (only in development)
 * @returns NextResponse with 500 status
 *
 * @example
 * ```typescript
 * try {
 *   const response = await difyClient.chat(message);
 * } catch (error) {
 *   logger.error({ error }, 'Dify API error');
 *   return difyError();
 * }
 * ```
 */
export function difyError(
  message = 'AI service unavailable',
  details?: Record<string, any>,
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'DIFY_ERROR',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details,
  );
}

/**
 * Returns 503 Service Unavailable error
 *
 * Use when a required service is not configured or temporarily unavailable.
 *
 * @param message - Optional custom message (default: "Service temporarily unavailable")
 * @returns NextResponse with 503 status
 *
 * @example
 * ```typescript
 * if (!serviceRoleKey) {
 *   return serviceUnavailableError('Account deletion service is not configured');
 * }
 * ```
 */
export function serviceUnavailableError(
  message = 'Service temporarily unavailable',
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    message,
    'SERVICE_UNAVAILABLE',
    HTTP_STATUS.SERVICE_UNAVAILABLE,
  );
}
