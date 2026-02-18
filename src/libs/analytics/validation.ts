/**
 * Analytics Event Validation and Sanitization
 * Utilities for ensuring data privacy and quality
 */

import type { EventName, EventPropertiesMap } from './events';

/**
 * Sanitize error message to remove sensitive data
 * - Removes stack traces
 * - Truncates to 200 characters
 * - Removes file paths and email addresses
 *
 * @param message - Raw error message
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove stack traces (everything after first newline)
  const withoutStack = message.split('\n')[0] || '';

  // Truncate to 200 characters
  const truncated = withoutStack.slice(0, 200);

  // Remove potential file paths
  let sanitized = truncated.replace(/\/\S+/g, '[path]');

  // Remove email addresses
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+/g, '[email]');

  return sanitized;
}

/**
 * Truncate string value if too long
 * Prevents data bloat in analytics
 *
 * @param value - String to truncate
 * @param maxLength - Maximum length (default: 500)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(value: string, maxLength = 500): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

/**
 * Remove potentially sensitive data from properties
 * - Redacts password, token, secret, key fields
 * - Truncates long strings
 * - Preserves other data types
 *
 * @param properties - Event properties to sanitize
 * @returns Sanitized properties
 */
export function sanitizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip sensitive fields (use word boundaries and common patterns)
    const lowerKey = key.toLowerCase();
    const sensitivePatterns = [
      /password/,
      /token/,
      /secret/,
      /(api|access|private)[_-]?key/,
      // Match 'key' only if it's at the end or followed by underscore/dash
      /key(_|$)/,
    ];

    if (sensitivePatterns.some(pattern => pattern.test(lowerKey))) {
      sanitized[key] = '[redacted]';
      continue;
    }

    // Truncate long strings
    if (typeof value === 'string') {
      sanitized[key] = truncateString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate event properties (non-blocking)
 * Logs validation errors in development but doesn't prevent tracking
 *
 * @param eventName - Event name
 * @param properties - Event properties
 * @returns True if properties are valid
 */
export function validateEventProperties<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T],
): boolean {
  // Basic validation - just check properties exist
  if (!properties || typeof properties !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Analytics] Invalid properties for event ${eventName}:`, properties);
    }
    return false;
  }

  return true;
}
