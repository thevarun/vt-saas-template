import type { User } from '@supabase/supabase-js';

// Lazily cache admin emails for O(1) lookup
let cachedAdminEmails: Set<string> | null = null;
let cachedEnvValue: string | undefined;

function getAdminEmailSet(): Set<string> {
  const envValue = process.env.ADMIN_EMAILS;
  if (cachedAdminEmails && cachedEnvValue === envValue) {
    return cachedAdminEmails;
  }
  cachedEnvValue = envValue;
  cachedAdminEmails = new Set(
    (envValue ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0),
  );
  return cachedAdminEmails;
}

/**
 * Determines if a user has admin privileges.
 *
 * Admin status can be granted via:
 * 1. app_metadata.isAdmin flag in Supabase (primary method)
 * 2. Email address in ADMIN_EMAILS environment variable (fallback)
 *
 * This function is designed to run in middleware with <50ms performance.
 * It does NOT make any database queries.
 *
 * @param user - Supabase user object (can be null/undefined)
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  // Check app_metadata.isAdmin flag first (primary method)
  // app_metadata is NOT user-editable, preventing privilege escalation
  // Strict equality check - must be exactly boolean true
  if (user.app_metadata?.isAdmin === true) {
    return true;
  }

  // Fallback: check ADMIN_EMAILS (lazily cached for performance)
  const adminEmails = getAdminEmailSet();
  if (user.email && adminEmails.size > 0) {
    return adminEmails.has(user.email.toLowerCase());
  }

  return false;
}
