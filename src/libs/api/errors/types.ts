/**
 * API Error Handling Types
 *
 * Standardized error types for consistent API error responses across the application.
 * All API error responses follow the format: { error: string, code: string, details?: object }
 *
 * @see /docs/api-error-handling.md for comprehensive guide
 */

/**
 * Standard API error codes used across all API endpoints
 *
 * - AUTH_REQUIRED: User is not authenticated
 * - FORBIDDEN: User is authenticated but lacks permission
 * - INVALID_REQUEST: Request is malformed or missing required fields
 * - VALIDATION_ERROR: Request validation failed (includes field-level details)
 * - NOT_FOUND: Requested resource does not exist
 * - CONFLICT: Resource conflict (e.g., duplicate unique field)
 * - DB_ERROR: Database operation failed
 * - INTERNAL_ERROR: Unexpected server error
 * - DIFY_ERROR: External Dify API error
 * - MESSAGE_TOO_LONG: Message exceeds maximum length
 * - INVALID_CONVERSATION_ID: Conversation ID is invalid or malformed
 * - DUPLICATE_CONVERSATION_ID: Conversation ID already exists
 * - SERVICE_UNAVAILABLE: Required service is not configured or unavailable
 */
export type ApiErrorCode
  = | 'AUTH_REQUIRED'
    | 'FORBIDDEN'
    | 'INVALID_REQUEST'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'DB_ERROR'
    | 'INTERNAL_ERROR'
    | 'DIFY_ERROR'
    | 'MESSAGE_TOO_LONG'
    | 'INVALID_CONVERSATION_ID'
    | 'DUPLICATE_CONVERSATION_ID'
    | 'SERVICE_UNAVAILABLE';

/**
 * Standard API error response format
 *
 * All error responses from API endpoints follow this structure:
 * - error: Human-readable error message for display
 * - code: Machine-readable error code for programmatic handling
 * - details: Optional additional context (validation errors, debug info in dev)
 *
 * @example
 * ```typescript
 * {
 *   error: "Validation failed",
 *   code: "VALIDATION_ERROR",
 *   details: {
 *     conversationId: ["Conversation ID is required"]
 *   }
 * }
 * ```
 */
export type ApiErrorResponse = {
  error: string;
  code: ApiErrorCode;
  details?: Record<string, any>;
};

/**
 * Standard API success response format
 *
 * All successful responses from API endpoints wrap data in this structure:
 * - data: The response payload
 *
 * @example
 * ```typescript
 * {
 *   data: {
 *     thread: { id: "123", title: "My Thread" }
 *   }
 * }
 * ```
 */
export type ApiSuccessResponse<T> = {
  data: T;
};

/**
 * HTTP status codes used for API responses
 *
 * Maps error types to appropriate HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
