/**
 * API Error Logging
 *
 * Centralized error logging for API routes with structured context.
 * Integrates with the application logger and Sentry for comprehensive error tracking.
 */

import * as Sentry from '@sentry/nextjs';

import { logger } from '@/libs/Logger';

/**
 * Context information for API error logging
 */
export type ApiErrorContext = {
  /** API endpoint path (e.g., "/api/threads") */
  endpoint: string;
  /** HTTP method (e.g., "GET", "POST") */
  method: string;
  /** User ID if authenticated */
  userId?: string;
  /** Request ID for tracking (if available) */
  requestId?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Error code for categorization */
  errorCode?: string;
  /** Additional context data */
  metadata?: Record<string, any>;
};

/**
 * Logs an API error with structured context
 *
 * This function:
 * 1. Logs to the application logger with full context
 * 2. Captures exception to Sentry with tags and breadcrumbs
 * 3. Includes request metadata for debugging
 *
 * @param error - Error object or unknown error
 * @param context - API request context
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... business logic
 *   } catch (error) {
 *     logApiError(error, {
 *       endpoint: '/api/threads',
 *       method: 'GET',
 *       userId: user?.id,
 *       errorCode: 'DB_ERROR',
 *     });
 *     return internalError();
 *   }
 * }
 * ```
 */
export function logApiError(
  error: Error | unknown,
  context: ApiErrorContext,
): void {
  const {
    endpoint,
    method,
    userId,
    requestId,
    statusCode,
    errorCode,
    metadata,
  } = context;

  // Log to application logger with structured data
  logger.error(
    {
      error: error instanceof Error ? error : new Error(String(error)),
      endpoint,
      method,
      userId,
      requestId,
      statusCode,
      errorCode,
      ...metadata,
    },
    `API Error: ${method} ${endpoint}`,
  );

  // Capture to Sentry with additional context
  Sentry.captureException(error, (scope) => {
    // Add tags for filtering in Sentry
    scope.setTags({
      api_endpoint: endpoint,
      api_method: method,
      error_code: errorCode || 'UNKNOWN',
      status_code: statusCode?.toString() || 'unknown',
    });

    // Add user context if available
    if (userId) {
      scope.setUser({ id: userId });
    }

    // Add breadcrumbs for request flow
    scope.addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint}`,
      level: 'error',
      data: {
        requestId,
        errorCode,
        statusCode,
        ...metadata,
      },
    });

    // Add additional context
    scope.setContext('api_error', {
      endpoint,
      method,
      userId,
      requestId,
      statusCode,
      errorCode,
      ...metadata,
    });

    return scope;
  });
}

/**
 * Logs a validation error with field-level details
 *
 * Specialized logging for validation errors that includes field information.
 *
 * @param validationErrors - Field-level validation errors
 * @param context - API request context
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(body);
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error);
 *   logValidationError(errors, {
 *     endpoint: '/api/threads',
 *     method: 'POST',
 *     userId: user.id,
 *   });
 *   return validationError(errors);
 * }
 * ```
 */
export function logValidationError(
  validationErrors: Record<string, any>,
  context: ApiErrorContext,
): void {
  logApiError(new Error('Validation failed'), {
    ...context,
    errorCode: 'VALIDATION_ERROR',
    statusCode: 400,
    metadata: {
      validationErrors,
      ...(context.metadata || {}),
    },
  });
}

/**
 * Logs an authentication error
 *
 * Specialized logging for authentication failures.
 *
 * @param reason - Reason for authentication failure
 * @param context - API request context
 *
 * @example
 * ```typescript
 * const { user, error } = await supabase.auth.getUser();
 * if (error || !user) {
 *   logAuthError('Invalid session', {
 *     endpoint: '/api/threads',
 *     method: 'GET',
 *   });
 *   return unauthorizedError();
 * }
 * ```
 */
export function logAuthError(reason: string, context: ApiErrorContext): void {
  logApiError(new Error(`Authentication failed: ${reason}`), {
    ...context,
    errorCode: 'AUTH_REQUIRED',
    statusCode: 401,
  });
}

/**
 * Logs an authorization error (forbidden)
 *
 * Specialized logging for authorization failures.
 *
 * @param reason - Reason for authorization failure
 * @param context - API request context
 *
 * @example
 * ```typescript
 * if (thread.user_id !== user.id) {
 *   logAuthzError('User does not own thread', {
 *     endpoint: '/api/threads/123',
 *     method: 'PATCH',
 *     userId: user.id,
 *     metadata: { threadId: '123', threadOwnerId: thread.user_id },
 *   });
 *   return forbiddenError();
 * }
 * ```
 */
export function logAuthzError(reason: string, context: ApiErrorContext): void {
  logApiError(new Error(`Authorization failed: ${reason}`), {
    ...context,
    errorCode: 'FORBIDDEN',
    statusCode: 403,
  });
}

/**
 * Logs a database error
 *
 * Specialized logging for database operation failures.
 *
 * @param operation - Database operation that failed (e.g., "fetch threads", "create thread")
 * @param error - Database error object
 * @param context - API request context
 *
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('threads').select();
 * if (error) {
 *   logDbError('fetch threads', error, {
 *     endpoint: '/api/threads',
 *     method: 'GET',
 *     userId: user.id,
 *   });
 *   return dbError();
 * }
 * ```
 */
export function logDbError(
  operation: string,
  error: any,
  context: ApiErrorContext,
): void {
  logApiError(error, {
    ...context,
    errorCode: 'DB_ERROR',
    statusCode: 500,
    metadata: {
      operation,
      ...(context.metadata || {}),
    },
  });
}
