import type { User } from '@supabase/supabase-js';

/**
 * Resolve the display name for a user.
 *
 * Precedence:
 *   1. profile.displayName (canonical — set via onboarding or settings)
 *   2. Email prefix (anonymous fallback for users who haven't set a name)
 *   3. Empty string
 */
export function getDisplayName(
  user: User | null | undefined,
  profile?: { displayName?: string | null } | null,
): string {
  if (profile?.displayName) {
    return profile.displayName;
  }
  if (user?.email) {
    return user.email.split('@')[0] ?? '';
  }
  return '';
}
