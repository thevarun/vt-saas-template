import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { Env } from '@/libs/Env';

/**
 * Creates a Supabase admin client using the service role key.
 * Use this for admin operations like deleting users.
 *
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function createAdminClient() {
  const serviceRoleKey = Env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations.',
    );
  }

  return createSupabaseClient(Env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
