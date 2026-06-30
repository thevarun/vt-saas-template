import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { referenceOAuthProvider } from './oauth-provider';

// Mock the Env module before importing oauth-provider.ts
vi.mock('@/libs/Env', () => ({
  Env: {
    OAUTH_PROVIDER_CLIENT_ID: 'test-client-id',
    OAUTH_PROVIDER_CLIENT_SECRET: 'test-client-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn() },
}));

describe('referenceOAuthProvider.getAuthUrl', () => {
  it('returns a URL containing the client_id', () => {
    const url = referenceOAuthProvider.getAuthUrl('test-state');

    expect(url).toContain('client_id=test-client-id');
  });

  it('returns a URL pointing redirect_uri at the generic callback path', () => {
    const url = referenceOAuthProvider.getAuthUrl('test-state');

    expect(url).toContain('redirect_uri=');
    expect(url).toContain('api%2Fauth%2Fcallback%2Fmy-provider');
  });

  it('returns a URL containing the state param', () => {
    const state = 'abc123xyz';
    const url = referenceOAuthProvider.getAuthUrl(state);

    expect(url).toContain(`state=${state}`);
  });

  it('returns a URL containing the configured scopes', () => {
    const url = referenceOAuthProvider.getAuthUrl('s');

    // scope is URL-encoded
    expect(url).toContain('scope=openid');
    expect(url).toContain('email');
  });

  it('returns a URL with response_type=code', () => {
    const url = referenceOAuthProvider.getAuthUrl('s');

    expect(url).toContain('response_type=code');
  });
});

describe('referenceOAuthProvider.exchangeCode', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the token endpoint with grant_type=authorization_code and code', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'acc',
        expires_in: 3600,
        token_type: 'Bearer' as const,
        scope: 'openid profile',
      }),
    } as Response);

    await referenceOAuthProvider.exchangeCode('auth-code-123');

    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0]!;

    expect(url).toContain('/accessToken');
    expect(options?.method).toBe('POST');

    const body = options?.body?.toString() ?? '';

    expect(body).toContain('grant_type=authorization_code');
    expect(body).toContain('code=auth-code-123');
  });

  it('throws when the token endpoint returns non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    await expect(referenceOAuthProvider.exchangeCode('bad-code')).rejects.toThrow('OAuth token exchange failed');
  });
});

describe('referenceOAuthProvider.getUserInfo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GETs the userinfo endpoint with Authorization Bearer header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'provider-account-id',
        name: 'Jane Smith',
        given_name: 'Jane',
        family_name: 'Smith',
      }),
    } as Response);

    await referenceOAuthProvider.getUserInfo('my-access-token');

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;

    expect(url).toContain('/userinfo');
    expect((options?.headers as Record<string, string>)?.Authorization).toBe('Bearer my-access-token');
  });

  it('throws when the userinfo endpoint returns non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    await expect(referenceOAuthProvider.getUserInfo('expired-token')).rejects.toThrow('OAuth userinfo fetch failed');
  });
});

describe('referenceOAuthProvider.refreshToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to the token endpoint with grant_type=refresh_token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-acc',
        expires_in: 3600,
        token_type: 'Bearer' as const,
        scope: 'openid profile',
      }),
    } as Response);

    await referenceOAuthProvider.refreshToken('my-refresh-token');

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;

    expect(url).toContain('/accessToken');

    const body = options?.body?.toString() ?? '';

    expect(body).toContain('grant_type=refresh_token');
    expect(body).toContain('refresh_token=my-refresh-token');
  });

  it('throws when the refresh endpoint returns non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    await expect(referenceOAuthProvider.refreshToken('invalid-refresh')).rejects.toThrow('OAuth token refresh failed');
  });
});
