/**
 * Validation Error Formatters
 *
 * Utilities for transforming validation errors (e.g., Zod) into user-friendly formats
 * suitable for API responses and form display.
 */

import type { z } from 'zod';

/**
 * Formats Zod validation errors into field-level error messages
 *
 * Transforms Zod's error format into a flat object mapping field paths to error messages.
 * This format is easier to consume in frontend forms.
 *
 * @param zodError - Zod validation error object
 * @returns Record mapping field paths to error message arrays
 *
 * @example
 * Input (Zod error):
 * ```typescript
 * {
 *   issues: [
 *     { path: ['conversationId'], message: 'Required' },
 *     { path: ['title'], message: 'Too short' }
 *   ]
 * }
 * ```
 *
 * Output:
 * ```typescript
 * {
 *   conversationId: ['Required'],
 *   title: ['Too short']
 * }
 * ```
 *
 * @example Usage in API route:
 * ```typescript
 * const result = schema.safeParse(body);
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error);
 *   return validationError(errors);
 * }
 * ```
 */
export function formatZodErrors(
  zodError: z.ZodError,
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    const message = issue.message;

    if (!formatted[path]) {
      formatted[path] = [];
    }

    formatted[path].push(message);
  }

  return formatted;
}

/**
 * Formats Zod validation errors into a flat array of error messages
 *
 * Useful for displaying a simple list of validation errors without field context.
 *
 * @param zodError - Zod validation error object
 * @returns Array of error messages
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(body);
 * if (!result.success) {
 *   const messages = formatZodErrorsFlat(result.error);
 *   // ["Conversation ID is required", "Title must be at least 3 characters"]
 * }
 * ```
 */
export function formatZodErrorsFlat(zodError: z.ZodError): string[] {
  return zodError.issues.map(issue => issue.message);
}

/**
 * Extracts the first error message from a Zod validation error
 *
 * Useful when you only need to display one error message at a time.
 *
 * @param zodError - Zod validation error object
 * @returns First error message or fallback
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(body);
 * if (!result.success) {
 *   const message = getFirstZodError(result.error);
 *   toast.error(message);
 * }
 * ```
 */
export function getFirstZodError(
  zodError: z.ZodError,
  fallback = 'Validation failed',
): string {
  return zodError.issues[0]?.message || fallback;
}

/**
 * Formats a field path into a human-readable name
 *
 * Converts camelCase/snake_case field names into title case with spaces.
 *
 * @param path - Field path (e.g., "conversationId", "user.email")
 * @returns Human-readable field name
 *
 * @example
 * ```typescript
 * formatFieldName('conversationId') // "Conversation Id"
 * formatFieldName('user.emailAddress') // "User Email Address"
 * ```
 */
export function formatFieldName(path: string): string {
  // Split on dots for nested paths
  const segments = path.split('.');

  // Format each segment
  const formatted = segments.map((segment) => {
    // Split camelCase into words
    const words = segment
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
      .split(/\s+/);

    // Capitalize first letter of each word
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  return formatted.join(' ');
}

/**
 * Formats Zod errors with human-readable field names
 *
 * Similar to formatZodErrors but replaces field paths with human-readable names.
 *
 * @param zodError - Zod validation error object
 * @returns Record mapping human-readable field names to error messages
 *
 * @example
 * ```typescript
 * {
 *   "Conversation Id": ["Required"],
 *   "Email Address": ["Invalid email format"]
 * }
 * ```
 */
export function formatZodErrorsReadable(
  zodError: z.ZodError,
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    const readablePath = formatFieldName(path);
    const message = issue.message;

    if (!formatted[readablePath]) {
      formatted[readablePath] = [];
    }

    formatted[readablePath].push(message);
  }

  return formatted;
}
