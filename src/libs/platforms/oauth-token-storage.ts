import type { SupabaseClient } from '@supabase/supabase-js';

import { encryptToken } from '@/libs/crypto/token-encryption';
import { logger } from '@/libs/Logger';

import type { OAuthProvider } from './oauth-provider';
import type { OAuthCallbackResult } from './types';

const DEFAULT_TOKEN_EXPIRY_SECONDS = 5_184_000; // 60 days

// platform_connections is not in the generated supabase types.ts until
// `db:gen-types` runs against a live DB, so callers pass any client built by
// `@/libs/supabase/{server,admin}`. Narrow this once the table is in the
// generated types and the createClient factory is typed.
type PlatformSupabaseClient = SupabaseClient<any, any, any>;

/**
 * Stores OAuth tokens for a provider in `platform_connections`.
 *
 * Talks to the provider only through the `OAuthProvider` seam (`getUserInfo`),
 * so a second provider drops in with no change here. Tokens are encrypted
 * (AES-256-GCM) before being written; the safe fetcher never selects them back.
 */
export async function storeOAuthTokens({
  provider,
  userId,
  providerToken,
  providerRefreshToken,
  scope = null,
  supabase,
  expiresIn = DEFAULT_TOKEN_EXPIRY_SECONDS,
}: {
  provider: OAuthProvider;
  userId: string;
  providerToken: string;
  providerRefreshToken?: string | null;
  /** Scopes granted on this connection (from the token response), if known. */
  scope?: string | null;
  supabase: PlatformSupabaseClient;
  expiresIn?: number;
}): Promise<OAuthCallbackResult> {
  try {
    // Fetch the provider profile using the access token (via the seam)
    const userInfo = await provider.getUserInfo(providerToken);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(providerToken);
    const encryptedRefreshToken = providerRefreshToken
      ? encryptToken(providerRefreshToken)
      : null;

    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000,
    ).toISOString();

    // Upsert — handles both new connections and token refreshes on re-connect
    const { error: upsertError } = await supabase
      .from('platform_connections')
      .upsert(
        {
          user_id: userId,
          provider: provider.id,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          provider_account_id: userInfo.sub,
          // Prefer a provider handle when available; fall back to the full name.
          username: userInfo.preferred_username ?? userInfo.name,
          display_name: userInfo.name,
          profile_picture_url: userInfo.picture ?? null,
          scope,
          // Column default ('connected') only fires on INSERT — set it explicitly
          // so re-connecting an 'expired' row is reset back to 'connected'.
          status: 'connected',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );

    if (upsertError) {
      logger.error({ error: upsertError }, 'OAuth token storage: platform_connections upsert failed');
      return { success: false, error: 'db_error' };
    }

    return {
      success: true,
      providerAccountId: userInfo.sub,
      username: userInfo.preferred_username ?? userInfo.name,
    };
  } catch (err) {
    logger.error({ error: err }, 'OAuth token storage failed');
    return { success: false, error: err instanceof Error ? err.message : 'unknown_error' };
  }
}
