/**
 * API Error Handling
 *
 * Centralized error handling utilities for consistent API responses.
 * Export all error types, response builders, validation formatters, and logging utilities.
 *
 * @example
 * ```typescript
 * import {
 *   unauthorizedError,
 *   validationError,
 *   formatZodErrors,
 *   logApiError,
 * } from '@/libs/api/errors';
 * ```
 */

// Logging
export type { ApiErrorContext } from './logger';
export {
  logApiError,
  logAuthError,
  logAuthzError,
  logDbError,
  logValidationError,
} from './logger';

// Response builders
export {
  conflictError,
  createErrorResponse,
  dbError,
  difyError,
  forbiddenError,
  internalError,
  invalidRequestError,
  notFoundError,
  unauthorizedError,
  validationError,
} from './responses';

// Types
export type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse } from './types';
export { HTTP_STATUS } from './types';
// Validation formatters
export {
  formatFieldName,
  formatZodErrors,
  formatZodErrorsFlat,
  formatZodErrorsReadable,
  getFirstZodError,
} from './validation';
