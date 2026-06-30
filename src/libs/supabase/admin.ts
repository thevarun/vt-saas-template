import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { Env } from '@/libs/Env';

// types.ts is a stub, so the admin client stays untyped. The explicit
// `<any, string>` generics let `db.schema` accept the runtime DB_SCHEMA value
// (the default generic narrows `schema` to `undefined`, rejecting any string).
let cachedClient: ReturnType<typeof createSupabaseClient<any, string>> | null
  = null;

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

  cachedClient = createSupabaseClient<any, string>(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      db: { schema: Env.NEXT_PUBLIC_DB_SCHEMA },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedClient;
}
