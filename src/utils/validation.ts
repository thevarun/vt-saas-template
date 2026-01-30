/**
 * Shared validation utilities for API routes.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that a string is a valid UUID v4 format.
 *
 * @param value - The string to validate
 * @returns true if the string matches UUID format
 *
 * @example
 * ```typescript
 * if (!isValidUuid(userId)) {
 *   return invalidRequestError('Invalid user ID format')
 * }
 * ```
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
