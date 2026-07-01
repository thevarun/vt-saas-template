/**
 * Generic single-provider OAuth types.
 *
 * The token/user-info shapes follow the OpenID Connect standard so they map
 * cleanly onto most providers. To target a different first provider, swap the
 * reference implementation in `oauth-provider.ts` — these types stay put.
 */

// Free-text provider id (single-provider today, extensible to many).
export type PlatformType = string;

export type PlatformConnectionStatus
  = 'connected' | 'expiring_soon' | 'expired' | 'disconnected';

export type PlatformConnection = {
  id: string;
  userId: string;
  provider: PlatformType;
  accessToken: string; // encrypted at rest
  refreshToken: string | null;
  tokenExpiresAt: string | null; // ISO 8601
  providerAccountId: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  status: PlatformConnectionStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// Safe read model — never exposes tokens.
export type PlatformConnectionSafe = Omit<
  PlatformConnection,
  'accessToken' | 'refreshToken'
>;

export type OAuthTokenResponse = {
  access_token: string;
  expires_in: number; // seconds until expiry
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: 'Bearer';
  scope: string;
};

// OpenID Connect standard userinfo fields.
export type OAuthUserInfo = {
  sub: string; // stable provider account id
  name: string; // full display name
  preferred_username?: string; // provider handle / short username (OIDC optional)
  given_name: string;
  family_name: string;
  email?: string;
  picture?: string;
};

export type OAuthCallbackResult
  = | { success: true; providerAccountId: string; username: string }
    | { success: false; error: string };
