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

// Types
export type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse } from './types';
export { HTTP_STATUS } from './types';

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

// Validation formatters
export {
  formatFieldName,
  formatZodErrors,
  formatZodErrorsFlat,
  formatZodErrorsReadable,
  getFirstZodError,
} from './validation';

// Logging
export type { ApiErrorContext } from './logger';
export {
  logApiError,
  logAuthError,
  logAuthzError,
  logDbError,
  logValidationError,
} from './logger';
