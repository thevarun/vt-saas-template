import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

import type { OAuthTokenResponse, OAuthUserInfo } from './types';

/**
 * The key abstraction of the platforms layer.
 *
 * An `OAuthProvider` is the seam every consumer (connect/callback routes,
 * token storage, refresh cron) talks to. Targeting a different first provider
 * means swapping only the reference implementation below — this interface and
 * all consumers stay put. Adding a second provider is a drop-in.
 */
export type OAuthProvider = {
  /** Stable provider id (used in routes, the registry, and DB rows). */
  readonly id: string;
  /** Build the provider's authorization URL, carrying the CSRF `state`. */
  getAuthUrl: (state: string) => string;
  /** Exchange an authorization `code` for access/refresh tokens. */
  exchangeCode: (code: string) => Promise<OAuthTokenResponse>;
  /** Fetch the OpenID Connect userinfo for an access token. */
  getUserInfo: (accessToken: string) => Promise<OAuthUserInfo>;
  /** Exchange a refresh token for a fresh access token. */
  refreshToken: (refreshToken: string) => Promise<OAuthTokenResponse>;
};

// ── Reference provider configuration ──────────────────────────────────────────
// Neutral placeholder endpoints/scopes — the concrete implementation behind the
// seam, NOT the contract. A fork targeting a real provider replaces only this
// block with that provider's authorization/API URLs and scopes.
//
// Keep SCOPES to the minimum your integration needs (principle of least
// privilege) — the OpenID baseline below is enough to identify a user.

const PROVIDER_ID = 'my-provider';
const AUTH_BASE = 'https://auth.example.com/oauth/v2';
const API_BASE = 'https://api.example.com/v2';
const SCOPES = 'openid profile email';

/**
 * Read a failed response's body for logging, truncated to a safe length.
 * On the error paths this is an OAuth error payload, never tokens — but a
 * non-standard provider could echo the submitted code/refresh_token in an error
 * body, so we cap it rather than dumping the full response into logs.
 */
async function readErrorBody(res: Response): Promise<string> {
  const body = await res.text().catch(() => '<unreadable>');
  return body.length > 500 ? `${body.slice(0, 500)}…` : body;
}

function getAppUrl(): string {
  return Env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/auth/callback/${PROVIDER_ID}`;
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = Env.OAUTH_PROVIDER_CLIENT_ID;
  const clientSecret = Env.OAUTH_PROVIDER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('OAuth provider credentials are not configured');
  }
  return { clientId, clientSecret };
}

function getAuthUrl(state: string): string {
  const clientId = Env.OAUTH_PROVIDER_CLIENT_ID;
  if (!clientId) {
    throw new Error('OAUTH_PROVIDER_CLIENT_ID is not configured');
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
  });
  return `${AUTH_BASE}/authorization?${params.toString()}`;
}

async function exchangeCode(code: string): Promise<OAuthTokenResponse> {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    logger.error({ status: res.status, body, op: 'oauth_token_exchange' }, 'oauth provider call failed');
    throw new Error(`OAuth token exchange failed: ${res.status}`);
  }

  return res.json() as Promise<OAuthTokenResponse>;
}

async function getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const res = await fetch(`${API_BASE}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    logger.error({ status: res.status, body, op: 'oauth_userinfo' }, 'oauth provider call failed');
    throw new Error(`OAuth userinfo fetch failed: ${res.status}`);
  }

  return res.json() as Promise<OAuthUserInfo>;
}

async function refreshToken(refreshTokenValue: string): Promise<OAuthTokenResponse> {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${AUTH_BASE}/accessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await readErrorBody(res);
    logger.error({ status: res.status, body, op: 'oauth_token_refresh' }, 'oauth provider call failed');
    throw new Error(`OAuth token refresh failed: ${res.status}`);
  }

  return res.json() as Promise<OAuthTokenResponse>;
}

/**
 * Reference `OAuthProvider` implementation behind the seam. Swap the config
 * block above (and these endpoints) to target a different provider; consumers
 * import the registry, not this object's specifics.
 */
export const referenceOAuthProvider: OAuthProvider = {
  id: PROVIDER_ID,
  getAuthUrl,
  exchangeCode,
  getUserInfo,
  refreshToken,
};

/**
 * Provider registry, keyed by id. A second provider is a drop-in: add its
 * implementation here. `getOAuthProvider` returns `null` for unknown ids so
 * routes can fail with a clean error redirect.
 */
const PROVIDERS: Record<string, OAuthProvider> = {
  [referenceOAuthProvider.id]: referenceOAuthProvider,
};

export function getOAuthProvider(id: string): OAuthProvider | null {
  return PROVIDERS[id] ?? null;
}
