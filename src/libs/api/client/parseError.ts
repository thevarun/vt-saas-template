/**
 * Client-side API Error Parser
 *
 * Utilities for parsing and handling API error responses in frontend code.
 * These functions help extract error information from API responses consistently.
 */

import type { ApiErrorResponse } from '../errors/types';

/**
 * Parsed error information from API response
 */
export type ParsedApiError = {
  /** User-friendly error message */
  message: string;
  /** Machine-readable error code */
  code: string;
  /** Optional additional details (e.g., validation errors) */
  details?: Record<string, any>;
};

/**
 * Parses an API error response into a standardized format
 *
 * Handles both successful error response parsing and fallback scenarios
 * for network errors or malformed responses.
 *
 * @param response - Fetch Response object
 * @returns Promise resolving to parsed error information
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetch('/api/threads', { method: 'POST', body: data });
 *   if (!response.ok) {
 *     const error = await parseApiError(response);
 *     console.error(`Error ${error.code}: ${error.message}`);
 *     if (error.details) {
 *       console.error('Details:', error.details);
 *     }
 *   }
 * } catch (error) {
 *   // Network error
 * }
 * ```
 */
export async function parseApiError(
  response: Response,
): Promise<ParsedApiError> {
  try {
    const json = (await response.json()) as ApiErrorResponse;

    return {
      message: json.error || 'An error occurred',
      code: json.code || 'UNKNOWN_ERROR',
      details: json.details,
    };
  } catch {
    // Fallback for responses that can't be parsed as JSON
    return {
      message: response.statusText || 'Network error occurred',
      code: 'NETWORK_ERROR',
    };
  }
}
