/** @module Validation error formatters for transforming Zod errors into field-level messages. */

import type { z } from 'zod';

/** Flatten Zod issues into a Record mapping field paths to error message arrays. */
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
