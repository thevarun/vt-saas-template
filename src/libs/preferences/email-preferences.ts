import { createAdminClient } from '@/libs/supabase/admin';

export type EmailPreferences = {
  emailNotifications: boolean;
};

const DEFAULTS: EmailPreferences = {
  emailNotifications: true,
};

type PreferencesLogger = {
  warn: (msg: string, data?: Record<string, unknown>) => void;
};

// Local row type + cast: the generated `src/libs/supabase/types.ts` is a
// placeholder stub with no real tables, so the admin client is not schema-typed
// and `.select(...)` rows surface as `never`. Declaring the shape here keeps this
// reader compiling against the stub (same approach as `src/libs/queries/item.ts`).
// A fork that generates real types can drop this and read the typed row directly.
type UserPreferencesRow = {
  email_notifications: boolean | null;
};

/**
 * Fetch a user's email notification preference.
 *
 * Called from server-side notification senders (e.g. an Inngest worker). Uses
 * the admin Supabase client to bypass RLS — these reads happen outside a user
 * request context, so there is no session cookie to authorize against.
 *
 * If no row exists for the user (new user who has never visited settings), or
 * the fetch errors, returns the "on" default. Erring on the side of sending is
 * intentional — silently suppressing notifications because of a transient infra
 * issue would be worse than an extra email.
 *
 * This is the server half of the preferences split; the client read/write hook
 * lives in `src/libs/hooks/use-user-preferences.ts` (intentionally decoupled —
 * server senders never import the client hook).
 */
export async function getUserEmailPreferences(
  userId: string,
  logger?: PreferencesLogger,
): Promise<EmailPreferences> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('email_notifications')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger?.warn('[email-preferences] Query error; using defaults', {
        userId,
        error: error.message,
      });
      return DEFAULTS;
    }

    if (!data) {
      return DEFAULTS;
    }

    const row = data as UserPreferencesRow;
    return {
      emailNotifications: row.email_notifications ?? DEFAULTS.emailNotifications,
    };
  } catch (err) {
    logger?.warn('[email-preferences] Unexpected error; using defaults', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return DEFAULTS;
  }
}
