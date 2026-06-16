import type { SupabaseClient } from '@supabase/supabase-js';

import { logger } from '@/libs/Logger';

// The generated `src/libs/supabase/types.ts` is a placeholder stub with no real
// tables, so the server client is not schema-typed and `.from(...)` rows surface
// as `never`. We accept a loosely-typed client here (same pragmatic approach as
// `src/libs/preferences/email-preferences.ts`); a fork that generates real types
// can tighten this to `SupabaseClient<Database, 'your_schema'>`.
type LooseSupabaseClient = SupabaseClient<any, any, any>;

/**
 * The single server-authoritative answer to "where does a user land after
 * authenticating?".
 *
 * Onboarding gate: the template treats the presence of a `user_preferences` row
 * as the onboarding-completion signal — `onboarding/page.tsx` derives
 * `isNewUser: !preferences` from exactly this. A user with no row hasn't been
 * through onboarding yet, so we send them to `/onboarding` regardless of where
 * they were headed; everyone else lands on a validated `preferredPath` or
 * `/dashboard`.
 *
 * Open-redirect safe: `preferredPath` is only honoured when it is a same-origin
 * relative path (starts with a single `/`).
 *
 * Fails open to `/onboarding`-or-`/dashboard` logic even if the preferences
 * lookup errors — auth must never be blocked by a transient DB hiccup.
 *
 * Always returns an absolute path starting with `/`.
 */
export async function getPostAuthDestination(options: {
  supabase: LooseSupabaseClient;
  userId: string;
  locale: string;
  /** A relative path the caller wanted to land on (e.g. from a `next`/`redirect` query param). Ignored for users who haven't completed onboarding. */
  preferredPath?: string | null;
}): Promise<string> {
  const { supabase, userId, locale, preferredPath } = options;
  const localePrefix = `/${locale}`;

  let hasCompletedOnboarding = false;
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error({ error }, 'getPostAuthDestination: preferences lookup failed');
      // Fail open: assume onboarded so a transient DB error never traps a
      // returning user in the onboarding flow.
      hasCompletedOnboarding = true;
    } else {
      hasCompletedOnboarding = data != null;
    }
  } catch (err) {
    logger.error({ error: err }, 'getPostAuthDestination: unexpected error');
    hasCompletedOnboarding = true;
  }

  if (!hasCompletedOnboarding) {
    return `${localePrefix}/onboarding`;
  }

  // Onboarded users: honour preferredPath if it's a safe relative path.
  if (
    preferredPath
    && preferredPath.startsWith('/')
    && !preferredPath.startsWith('//')
  ) {
    return preferredPath;
  }
  return `${localePrefix}/dashboard`;
}
