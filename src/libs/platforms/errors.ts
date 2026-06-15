/**
 * Strips the `". Details: …"` suffix from a platform error message before
 * surfacing it to the user. OAuth providers may append a `Details:` block with
 * internal diagnostics that we want in logs/Sentry but not in the user-facing
 * string.
 */
export const PLATFORM_ERROR_DETAILS_SUFFIX_RE = /\. Details:.*$/;

export function sanitizePlatformError(message: string): string {
  return message.replace(PLATFORM_ERROR_DETAILS_SUFFIX_RE, '');
}
