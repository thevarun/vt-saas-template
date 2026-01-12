/**
 * Client-side API Error Parser
 *
 * Utilities for parsing and handling API error responses in frontend code.
 * These functions help extract error information from API responses consistently.
 */

import type { ApiErrorResponse } from '../errors/types';

/**
 * Parsed error information from API response
 */
export type ParsedApiError = {
  /** User-friendly error message */
  message: string;
  /** Machine-readable error code */
  code: string;
  /** Optional additional details (e.g., validation errors) */
  details?: Record<string, any>;
};

/**
 * Parses an API error response into a standardized format
 *
 * Handles both successful error response parsing and fallback scenarios
 * for network errors or malformed responses.
 *
 * @param response - Fetch Response object
 * @returns Promise resolving to parsed error information
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetch('/api/threads', { method: 'POST', body: data });
 *   if (!response.ok) {
 *     const error = await parseApiError(response);
 *     console.error(`Error ${error.code}: ${error.message}`);
 *     if (error.details) {
 *       console.error('Details:', error.details);
 *     }
 *   }
 * } catch (error) {
 *   // Network error
 * }
 * ```
 */
export async function parseApiError(
  response: Response,
): Promise<ParsedApiError> {
  try {
    const json = (await response.json()) as ApiErrorResponse;

    return {
      message: json.error || 'An error occurred',
      code: json.code || 'UNKNOWN_ERROR',
      details: json.details,
    };
  } catch {
    // Fallback for responses that can't be parsed as JSON
    return {
      message: response.statusText || 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Checks if an error code indicates a client-side error (4xx)
 *
 * @param code - Error code from API response
 * @returns true if the error is a client error (user's fault)
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (isClientError(error.code)) {
 *   // Show validation message to user
 * } else {
 *   // Log server error, show generic message
 * }
 * ```
 */
export function isClientError(code: string): boolean {
  const clientErrorCodes = [
    'INVALID_REQUEST',
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'MESSAGE_TOO_LONG',
    'INVALID_CONVERSATION_ID',
  ];

  return clientErrorCodes.includes(code);
}

/**
 * Checks if an error code indicates an authentication error
 *
 * @param code - Error code from API response
 * @returns true if the error is an auth error
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (isAuthError(error.code)) {
 *   // Redirect to sign-in page
 *   router.push('/sign-in');
 * }
 * ```
 */
export function isAuthError(code: string): boolean {
  return code === 'AUTH_REQUIRED' || code === 'FORBIDDEN';
}

/**
 * Checks if an error code indicates a validation error
 *
 * @param code - Error code from API response
 * @returns true if the error is a validation error
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (isValidationError(error.code)) {
 *   // Display field-level validation errors
 *   setFormErrors(error.details);
 * }
 * ```
 */
export function isValidationError(code: string): boolean {
  return code === 'VALIDATION_ERROR';
}

/**
 * Extracts validation errors into a field-to-messages map
 *
 * Useful for displaying validation errors in forms.
 *
 * @param error - Parsed API error
 * @returns Map of field names to error messages, or empty object
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (isValidationError(error.code)) {
 *   const fieldErrors = extractValidationErrors(error);
 *   // fieldErrors = { conversationId: ["Required"], title: ["Too short"] }
 * }
 * ```
 */
export function extractValidationErrors(
  error: ParsedApiError,
): Record<string, string[]> {
  if (!error.details || !isValidationError(error.code)) {
    return {};
  }

  return error.details as Record<string, string[]>;
}

/**
 * Gets a user-friendly fallback message for an error code
 *
 * @param code - Error code
 * @returns Generic user-friendly message
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * const message = error.message || getFallbackMessage(error.code);
 * toast.error(message);
 * ```
 */
export function getFallbackMessage(code: string): string {
  const fallbackMessages: Record<string, string> = {
    AUTH_REQUIRED: 'Please sign in to continue',
    FORBIDDEN: 'You don\'t have permission to perform this action',
    VALIDATION_ERROR: 'Please check your input and try again',
    NOT_FOUND: 'The requested resource was not found',
    CONFLICT: 'This resource already exists',
    DB_ERROR: 'A database error occurred. Please try again',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again',
    DIFY_ERROR: 'The AI service is temporarily unavailable',
    NETWORK_ERROR: 'Network error. Please check your connection',
    MESSAGE_TOO_LONG: 'Your message is too long',
    INVALID_CONVERSATION_ID: 'Invalid conversation ID',
  };

  return fallbackMessages[code] || 'An error occurred. Please try again';
}
