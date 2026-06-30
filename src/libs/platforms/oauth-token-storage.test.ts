import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OAuthProvider } from './oauth-provider';
import { storeOAuthTokens } from './oauth-token-storage';

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn() },
}));

const mockEncryptToken = vi.fn();

vi.mock('@/libs/crypto/token-encryption', () => ({
  encryptToken: (...args: unknown[]) => mockEncryptToken(...args),
}));

const MOCK_USER_INFO = {
  sub: 'provider-account-123',
  name: 'Jane Doe',
  given_name: 'Jane',
  family_name: 'Doe',
  email: 'jane@example.com',
  picture: 'https://cdn.example.com/photo.jpg',
};

const mockGetUserInfo = vi.fn();

function makeProvider(): OAuthProvider {
  return {
    id: 'test-provider',
    getAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    getUserInfo: (...args: unknown[]) => mockGetUserInfo(...args),
    refreshToken: vi.fn(),
  };
}

function createMockSupabase({ upsertError = null }: { upsertError?: { message: string } | null } = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const from = vi.fn().mockReturnValue({ upsert });

  return { from, upsert } as const;
}

describe('storeOAuthTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserInfo.mockResolvedValue(MOCK_USER_INFO);
    mockEncryptToken.mockImplementation((token: string) => `encrypted:${token}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches user info, encrypts tokens, and upserts platform_connections', async () => {
    const { from, upsert } = createMockSupabase();

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'access-token-123',
      providerRefreshToken: 'refresh-token-456',
      scope: 'openid profile email',
      supabase: { from } as any,
      expiresIn: 3600,
    });

    expect(result).toEqual({
      success: true,
      providerAccountId: 'provider-account-123',
      username: 'Jane Doe',
    });

    // User info fetched via the provider seam with the access token
    expect(mockGetUserInfo).toHaveBeenCalledWith('access-token-123');

    // Both tokens were encrypted
    expect(mockEncryptToken).toHaveBeenCalledWith('access-token-123');
    expect(mockEncryptToken).toHaveBeenCalledWith('refresh-token-456');

    // Upsert called with correct table
    expect(from).toHaveBeenCalledWith('platform_connections');

    // Upsert data matches expected shape
    const upsertData = upsert.mock.calls[0]![0];

    expect(upsertData.user_id).toBe('user-abc');
    expect(upsertData.provider).toBe('test-provider');
    expect(upsertData.access_token).toBe('encrypted:access-token-123');
    expect(upsertData.refresh_token).toBe('encrypted:refresh-token-456');
    expect(upsertData.provider_account_id).toBe('provider-account-123');
    expect(upsertData.username).toBe('Jane Doe');
    expect(upsertData.profile_picture_url).toBe('https://cdn.example.com/photo.jpg');
    expect(upsertData.scope).toBe('openid profile email');
    // status must be set explicitly: the column default only fires on INSERT, so
    // a re-connect of an 'expired' row would otherwise stay 'expired'.
    expect(upsertData.status).toBe('connected');

    // Conflict resolution on user_id + provider
    const upsertOptions = upsert.mock.calls[0]![1];

    expect(upsertOptions).toEqual({ onConflict: 'user_id,provider' });
  });

  it('handles null refresh token (provider may not issue one)', async () => {
    const { from, upsert } = createMockSupabase();

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'access-token-123',
      providerRefreshToken: null,
      supabase: { from } as any,
    });

    expect(result.success).toBe(true);

    // Only access token should be encrypted
    expect(mockEncryptToken).toHaveBeenCalledTimes(1);
    expect(mockEncryptToken).toHaveBeenCalledWith('access-token-123');

    // Refresh token should be null in upsert
    expect(upsert.mock.calls[0]![0].refresh_token).toBeNull();
  });

  it('prefers preferred_username (provider handle) over the full name', async () => {
    mockGetUserInfo.mockResolvedValue({
      ...MOCK_USER_INFO,
      preferred_username: 'janedoe',
    });

    const { from, upsert } = createMockSupabase();

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    // username takes the handle; display_name keeps the full name
    expect(upsert.mock.calls[0]![0].username).toBe('janedoe');
    expect(upsert.mock.calls[0]![0].display_name).toBe('Jane Doe');
    expect(result).toMatchObject({ success: true, username: 'janedoe' });
  });

  it('defaults scope to null when not provided', async () => {
    const { from, upsert } = createMockSupabase();

    await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    expect(upsert.mock.calls[0]![0].scope).toBeNull();
  });

  it('handles missing profile picture', async () => {
    mockGetUserInfo.mockResolvedValue({
      ...MOCK_USER_INFO,
      picture: undefined,
    });

    const { from, upsert } = createMockSupabase();

    await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    expect(upsert.mock.calls[0]![0].profile_picture_url).toBeNull();
  });

  it('uses default 60-day expiry when expiresIn not provided', async () => {
    const { from, upsert } = createMockSupabase();
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    const tokenExpiresAt = upsert.mock.calls[0]![0].token_expires_at;
    const expectedExpiry = new Date(now + 5_184_000 * 1000).toISOString();

    expect(tokenExpiresAt).toBe(expectedExpiry);
  });

  it('returns db_error when upsert fails', async () => {
    const { from } = createMockSupabase({
      upsertError: { message: 'duplicate key violation' },
    });

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    expect(result).toEqual({ success: false, error: 'db_error' });
  });

  it('returns error when getUserInfo throws', async () => {
    mockGetUserInfo.mockRejectedValue(new Error('Provider API down'));

    const { from } = createMockSupabase();

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    expect(result).toEqual({ success: false, error: 'Provider API down' });
  });

  it('returns unknown_error for non-Error throws', async () => {
    mockGetUserInfo.mockRejectedValue('string error');

    const { from } = createMockSupabase();

    const result = await storeOAuthTokens({
      provider: makeProvider(),
      userId: 'user-abc',
      providerToken: 'token',
      supabase: { from } as any,
    });

    expect(result).toEqual({ success: false, error: 'unknown_error' });
  });
});
