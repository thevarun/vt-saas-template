import { cookies } from 'next/headers';
import { cache } from 'react';

import { createClient } from '@/libs/supabase/server';

/**
 * Request-scoped cached helper that returns an authenticated user along with
 * a Supabase server client. Deduplicates `supabase.auth.getUser()` calls
 * across the same React server-render request (or Server Action / Route
 * Handler invocation) by leveraging `react.cache`.
 *
 * IMPORTANT: This is server-only. Do NOT import it from client components.
 */
export const getCachedUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error, supabase };
});
