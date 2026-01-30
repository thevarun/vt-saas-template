import type { User } from '@supabase/supabase-js';

/**
 * Determines if a user has admin privileges.
 *
 * Admin status can be granted via:
 * 1. user_metadata.isAdmin flag in Supabase (primary method)
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

  // Check user_metadata.isAdmin flag first (primary method)
  // Strict equality check - must be exactly boolean true
  if (user.user_metadata?.isAdmin === true) {
    return true;
  }

  // Fallback: check ADMIN_EMAILS environment variable
  const adminEmails = process.env.ADMIN_EMAILS;
  if (adminEmails && user.email) {
    const emailList = adminEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    return emailList.includes(user.email.toLowerCase());
  }

  return false;
}
