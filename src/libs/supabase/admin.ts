import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { Env } from '@/libs/Env';

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Returns a singleton Supabase admin client using the service role key.
 * Use this for admin operations like deleting users.
 *
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function createAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const serviceRoleKey = Env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations.',
    );
  }

  cachedClient = createSupabaseClient(Env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
