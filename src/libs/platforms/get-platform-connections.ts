import type { SupabaseClient } from '@supabase/supabase-js';

import type { PlatformConnectionSafe, PlatformConnectionStatus } from './types';

/**
 * Fetch a user's platform connections in the SAFE shape (no encrypted tokens).
 *
 * The `.select()` allowlist deliberately omits `access_token` / `refresh_token`
 * so tokens can never reach a response body — defense in depth alongside RLS.
 */
export async function getPlatformConnections(
  // platform_connections is not in the generated supabase types.ts until
  // `db:gen-types` runs against a live DB — accept any built client for now.
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<PlatformConnectionSafe[]> {
  const { data, error } = await supabase
    .from('platform_connections')
    // Explicitly exclude access_token and refresh_token — never return encrypted tokens to client
    .select('id, provider, provider_account_id, username, display_name, profile_picture_url, status, token_expires_at, created_at, updated_at')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Map snake_case DB columns to camelCase TypeScript
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    userId,
    provider: row.provider as PlatformConnectionSafe['provider'],
    providerAccountId: row.provider_account_id as string,
    username: row.username as string,
    displayName: (row.display_name as string | null) ?? null,
    profilePictureUrl: (row.profile_picture_url as string | null) ?? null,
    status: row.status as PlatformConnectionStatus,
    tokenExpiresAt: (row.token_expires_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}
