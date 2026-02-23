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
