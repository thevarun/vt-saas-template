/**
 * Client-side API utilities
 *
 * Export all client-side error handling utilities for use in frontend code.
 *
 * @example
 * ```typescript
 * import { parseApiError, getErrorMessage } from '@/libs/api/client';
 * ```
 */

// Error display
export {
  getErrorMessage,
} from './displayError';
// Error parsing
export type { ParsedApiError } from './parseError';
export {
  parseApiError,
} from './parseError';
