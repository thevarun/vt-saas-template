/**
 * Error Display Utilities
 *
 * Utilities for displaying error messages to users with i18n support.
 * Maps technical error codes to user-friendly, translated messages.
 */

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
    UNAUTHORIZED: 'You must be signed in to perform this action',
    FORBIDDEN: 'You don\'t have permission to access this resource',
    INVALID_REQUEST: 'Invalid request. Please check your input',
    VALIDATION_ERROR: 'Please check your input and try again',
    NOT_FOUND: 'The requested resource was not found',
    GONE: 'This resource is no longer available',
    CONFLICT: 'This resource already exists',
    DB_ERROR: 'A database error occurred. Please try again later',
    SAVE_FAILED: 'Failed to save. Please try again',
    INTERNAL_ERROR: 'An unexpected error occurred. Please try again',
    DIFY_ERROR: 'The AI service is temporarily unavailable. Please try again',
    QUOTA_EXHAUSTED: 'Usage limit reached. Please try again later',
    RATE_LIMIT: 'Too many requests. Please slow down',
    MESSAGE_TOO_LONG: 'Your message exceeds the maximum length',
    INVALID_CONVERSATION_ID: 'Invalid conversation ID format',
    DUPLICATE_CONVERSATION_ID: 'A conversation with this ID already exists',
    NETWORK_ERROR: 'Network error. Please check your internet connection',
    UNKNOWN_ERROR: 'An error occurred. Please try again',
  };

  return messages[code] || messages.UNKNOWN_ERROR!;
}
