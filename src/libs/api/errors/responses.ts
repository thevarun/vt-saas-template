/** @module API error response builders for consistent error format: { error, code, details? } */

import { NextResponse } from 'next/server';

import type { ApiErrorCode, ApiErrorResponse } from './types';
import { HTTP_STATUS } from './types';

/** Create a standardized error response with the given message, code, status, and optional details. */
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

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
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
  details?: Record<string, any>,
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
