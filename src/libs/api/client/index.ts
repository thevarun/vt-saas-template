/**
 * Client-side API utilities
 *
 * Export all client-side error handling utilities for use in frontend code.
 *
 * @example
 * ```typescript
 * import { parseApiError, getErrorMessage, isAuthError } from '@/libs/api/client';
 * ```
 */

// Error parsing
export type { ParsedApiError } from './parseError';
export {
  extractValidationErrors,
  getFallbackMessage,
  isAuthError,
  isClientError,
  isValidationError,
  parseApiError,
} from './parseError';

// Error display
export {
  formatValidationDetails,
  getErrorMessage,
  getErrorTitle,
  isRetryableError,
} from './displayError';
