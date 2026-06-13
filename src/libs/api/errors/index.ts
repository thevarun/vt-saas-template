/** @module Centralized API error handling -- re-exports response builders, validation formatters, and logging. */

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
  goneError,
  internalError,
  invalidRequestError,
  notFoundError,
  quotaExhaustedError,
  rateLimitError,
  saveFailedError,
  serviceUnavailableError,
  timeoutError,
  unauthorizedError,
  usernameTakenError,
  validationError,
} from './responses';

// Types
export type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse, ValidationDetails } from './types';
export { HTTP_STATUS } from './types';
// Validation formatters
export {
  formatZodErrors,
} from './validation';
