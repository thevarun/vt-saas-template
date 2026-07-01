// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Schema/env modules read DB_SCHEMA at import time; this worktree has no
// .env.local, so set it before any import that pulls them in.
vi.hoisted(() => {
  process.env.DB_SCHEMA ??= 'vt_saas';
  process.env.NEXT_PUBLIC_DB_SCHEMA ??= 'vt_saas';
});

// Rows returned by the connections SELECT; each test sets this.
let selectRows: Array<Record<string, unknown>> = [];
const updateSpy = vi.fn((_updates: Record<string, string>) => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      // .select(...).gt(...).lt(...) chain resolves to the fixture rows.
      select: () => ({
        gt: () => ({
          lt: () => Promise.resolve({ data: selectRows, error: null }),
        }),
      }),
      update: updateSpy,
    }),
  }),
}));

const refreshTokenMock = vi.fn();
vi.mock('@/libs/platforms/oauth-provider', () => ({
  getOAuthProvider: (id: string) =>
    id === 'my-provider' ? { id, refreshToken: refreshTokenMock } : null,
}));

vi.mock('@/libs/crypto/token-encryption', () => ({
  decryptToken: (t: string) => `dec:${t}`,
  encryptToken: (t: string) => `enc:${t}`,
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const mockLogger = { info: vi.fn(), error: vi.fn() };

describe('refreshExpiringTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows = [];
    refreshTokenMock.mockReset();
  });

  it('skips a connection with no refresh_token and never updates the row', async () => {
    selectRows = [
      { id: 'c1', user_id: 'u1', provider: 'my-provider', refresh_token: null },
    ];
    const { refreshExpiringTokens } = await import('./token-refresh');

    const result = await refreshExpiringTokens(mockLogger);

    expect(result).toEqual({ refreshed: 0, skipped: 1, errors: 0 });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(refreshTokenMock).not.toHaveBeenCalled();
  });

  it('does NOT overwrite token_expires_at when the provider refresh fails', async () => {
    selectRows = [
      { id: 'c1', user_id: 'u1', provider: 'my-provider', refresh_token: 'r1' },
    ];
    refreshTokenMock.mockRejectedValue(new Error('transient 5xx'));
    const { refreshExpiringTokens } = await import('./token-refresh');
    const Sentry = await import('@sentry/nextjs');

    const result = await refreshExpiringTokens(mockLogger);

    expect(result).toEqual({ refreshed: 0, skipped: 0, errors: 1 });
    // The whole point: a transient failure must leave the stored row untouched.
    expect(updateSpy).not.toHaveBeenCalled();
    expect(vi.mocked(Sentry.captureException)).toHaveBeenCalledOnce();
  });

  it('decrypts, refreshes, re-encrypts and updates the row on success', async () => {
    selectRows = [
      { id: 'c1', user_id: 'u1', provider: 'my-provider', refresh_token: 'r1' },
    ];
    refreshTokenMock.mockResolvedValue({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_in: 3600,
    });
    const { refreshExpiringTokens } = await import('./token-refresh');

    const result = await refreshExpiringTokens(mockLogger);

    expect(result).toEqual({ refreshed: 1, skipped: 0, errors: 0 });
    expect(refreshTokenMock).toHaveBeenCalledWith('dec:r1');
    expect(updateSpy).toHaveBeenCalledOnce();

    const updates = updateSpy.mock.calls[0]![0];

    expect(updates.access_token).toBe('enc:new-access');
    expect(updates.refresh_token).toBe('enc:new-refresh');
    expect(updates.token_expires_at).toBeDefined();
  });
});
