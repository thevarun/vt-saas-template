/**
 * Error Display Utilities
 *
 * Utilities for displaying error messages to users with i18n support.
 * Maps technical error codes to user-friendly, translated messages.
 */

import type { ApiErrorCode } from '../errors/types';

/**
 * Gets a user-friendly error message for an error code
 *
 * Uses i18n translations when available, falls back to sensible defaults.
 *
 * @param code - Error code from API response
 * @param t - Translation function from next-intl
 * @returns Translated error message
 *
 * @example
 * ```typescript
 * import { useTranslations } from 'next-intl';
 *
 * const t = useTranslations();
 * const error = await parseApiError(response);
 * const message = getErrorMessage(error.code, t);
 * toast.error(message);
 * ```
 */
export function getErrorMessage(
  code: string,
  t: (key: string) => string,
): string {
  // Try to get translated message from errors namespace
  const translationKey = `errors.${code}`;

  try {
    const translated = t(translationKey);
    // If translation exists and is not the key itself, return it
    if (translated && translated !== translationKey) {
      return translated;
    }
  } catch {
    // Translation not found, fall through to defaults
  }

  // Fallback to default messages if no translation exists
  return getDefaultErrorMessage(code);
}

/**
 * Gets default error message for a code (no i18n)
 *
 * @param code - Error code
 * @returns Default English error message
 */
function getDefaultErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    AUTH_REQUIRED: 'You must be signed in to perform this action',
    FORBIDDEN: 'You don\'t have permission to access this resource',
    INVALID_REQUEST: 'Invalid request. Please check your input',
    VALIDATION_ERROR: 'Please check your input and try again',
    NOT_FOUND: 'The requested resource was not found',
    CONFLICT: 'This resource already exists',
    DB_ERROR: 'A database error occurred. Please try again later',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again',
    DIFY_ERROR: 'The AI service is temporarily unavailable. Please try again',
    MESSAGE_TOO_LONG: 'Your message exceeds the maximum length',
    INVALID_CONVERSATION_ID: 'Invalid conversation ID format',
    DUPLICATE_CONVERSATION_ID: 'A conversation with this ID already exists',
    NETWORK_ERROR: 'Network error. Please check your internet connection',
    UNKNOWN_ERROR: 'An error occurred. Please try again',
  };

  return messages[code] || messages.UNKNOWN_ERROR!;
}

/**
 * Gets a short error title for display in toasts or dialogs
 *
 * @param code - Error code from API response
 * @returns Short error title (e.g., "Validation Error", "Not Found")
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * toast.error({
 *   title: getErrorTitle(error.code),
 *   message: getErrorMessage(error.code, t),
 * });
 * ```
 */
export function getErrorTitle(code: string): string {
  const titles: Record<string, string> = {
    AUTH_REQUIRED: 'Authentication Required',
    FORBIDDEN: 'Access Denied',
    INVALID_REQUEST: 'Invalid Request',
    VALIDATION_ERROR: 'Validation Error',
    NOT_FOUND: 'Not Found',
    CONFLICT: 'Conflict',
    DB_ERROR: 'Database Error',
    INTERNAL_ERROR: 'Server Error',
    DIFY_ERROR: 'AI Service Error',
    MESSAGE_TOO_LONG: 'Message Too Long',
    INVALID_CONVERSATION_ID: 'Invalid ID',
    DUPLICATE_CONVERSATION_ID: 'Duplicate ID',
    NETWORK_ERROR: 'Network Error',
  };

  return titles[code] || 'Error';
}

/**
 * Determines if an error should be retryable
 *
 * @param code - Error code
 * @returns true if the operation can be retried
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (isRetryableError(error.code)) {
 *   toast.error({
 *     message: getErrorMessage(error.code, t),
 *     action: { label: 'Retry', onClick: handleRetry },
 *   });
 * }
 * ```
 */
export function isRetryableError(code: string): boolean {
  const retryableCodes: ApiErrorCode[] = [
    'DB_ERROR',
    'INTERNAL_ERROR',
    'DIFY_ERROR',
  ];

  return retryableCodes.includes(code as ApiErrorCode);
}

/**
 * Formats validation error details for display
 *
 * Converts field-level validation errors into user-friendly messages.
 *
 * @param details - Validation error details from API response
 * @returns Array of formatted error messages
 *
 * @example
 * ```typescript
 * const error = await parseApiError(response);
 * if (error.code === 'VALIDATION_ERROR' && error.details) {
 *   const messages = formatValidationDetails(error.details);
 *   // ["Conversation ID is required", "Title must be at least 3 characters"]
 *   messages.forEach(msg => toast.error(msg));
 * }
 * ```
 */
export function formatValidationDetails(
  details: Record<string, string[]>,
): string[] {
  const messages: string[] = [];

  for (const [field, errors] of Object.entries(details)) {
    for (const error of errors) {
      // Format field name from camelCase to Title Case
      const fieldName = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      messages.push(`${fieldName}: ${error}`);
    }
  }

  return messages;
}
