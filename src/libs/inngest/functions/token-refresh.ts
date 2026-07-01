import * as Sentry from '@sentry/nextjs';

import { decryptToken, encryptToken } from '@/libs/crypto/token-encryption';
import { getOAuthProvider } from '@/libs/platforms/oauth-provider';
import { createAdminClient } from '@/libs/supabase/admin';

import { inngest } from '../client';

// Proactive refresh: pick up tokens expiring within 30 days.
// After refresh, a long-lived token (e.g. 60-day expiry) falls outside this
// window and won't match again until 30 days before the new expiry —
// self-regulating. Short-lived tokens stay in-window and refresh every cycle.
const REFRESH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type Logger = {
  info: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Cron body — extracted as a named export so tests can exercise it directly with
 * a plain logger double (matches the template's other inngest functions).
 *
 * Refreshes OAuth tokens in `platform_connections` that expire within the
 * refresh window, going through the `OAuthProvider` seam (`refreshToken`) so any
 * provider drops in with no change here.
 *
 * @internal
 */
export async function refreshExpiringTokens(logger: Logger): Promise<{
  refreshed: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REFRESH_WINDOW_MS);

  // Connections whose tokens expire within the refresh window but aren't yet
  // expired.
  const { data: connections, error: fetchError } = await supabase
    .from('platform_connections')
    .select('id, user_id, provider, refresh_token, token_expires_at')
    .gt('token_expires_at', now.toISOString())
    .lt('token_expires_at', windowEnd.toISOString());

  if (fetchError) {
    logger.error('token-refresh: failed to fetch connections', {
      error: fetchError.message,
    });
    return { refreshed: 0, skipped: 0, errors: 0 };
  }

  let refreshed = 0;
  let skipped = 0;
  let errors = 0;

  for (const conn of connections ?? []) {
    const { id, user_id, provider: providerId, refresh_token } = conn;

    // No refresh token — there's nothing to refresh, so just skip. The token
    // will expire naturally at its scheduled time and the UI will surface
    // "Reconnect" then. Never overwrite token_expires_at here: doing so removes
    // the row from the SELECT window and locks the user out up to 30 days early.
    if (!refresh_token) {
      logger.info(
        `[token-refresh] No refresh token for ${providerId} user ${user_id} — skipping (will expire naturally)`,
      );
      skipped++;
      continue;
    }

    const provider = getOAuthProvider(providerId);
    if (!provider) {
      logger.error(
        `[token-refresh] Unknown provider "${providerId}" for user ${user_id} — skipping`,
      );
      skipped++;
      continue;
    }

    try {
      // decrypt → refresh → re-encrypt → update; only touch the DB on success.
      const decryptedRefreshToken = decryptToken(refresh_token);
      const tokenResponse = await provider.refreshToken(decryptedRefreshToken);

      const newExpiresAt = new Date(
        now.getTime() + tokenResponse.expires_in * 1000,
      ).toISOString();

      const updates: Record<string, string> = {
        access_token: encryptToken(tokenResponse.access_token),
        token_expires_at: newExpiresAt,
        updated_at: now.toISOString(),
      };
      // Providers may or may not rotate the refresh token — only update it when
      // a new one is returned.
      if (tokenResponse.refresh_token) {
        updates.refresh_token = encryptToken(tokenResponse.refresh_token);
      }

      const { error: updateError } = await supabase
        .from('platform_connections')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      logger.info(`[token-refresh] Refreshed ${providerId} token for user ${user_id}`);
      refreshed++;
    } catch (err) {
      Sentry.captureException(err, {
        contexts: { tokenRefresh: { provider: providerId, userId: user_id, connectionId: id } },
      });
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        `[token-refresh] Failed to refresh ${providerId} token for user ${user_id}: ${message}`,
      );

      // Do NOT overwrite token_expires_at on failure. Leaving the timestamp
      // alone keeps the row in the SELECT window so the cron retries every cycle
      // until the refresh succeeds or the token reaches its natural expiry — a
      // single transient error (network blip, 5xx, rate limit) must not
      // permanently kill the connection.
      errors++;
    }
  }

  logger.info(`[token-refresh] done — refreshed=${refreshed} skipped=${skipped} errors=${errors}`);
  return { refreshed, skipped, errors };
}

/**
 * Cron: proactively refreshes OAuth tokens in `platform_connections` that are
 * within 30 days of expiry, before they lapse. Runs every 30 minutes.
 */
export const tokenRefreshFunction = inngest.createFunction(
  {
    id: 'token-refresh',
    name: 'Token Refresh',
    triggers: [{ cron: '*/30 * * * *' }],
  },
  async ({ logger }) => refreshExpiringTokens(logger),
);
