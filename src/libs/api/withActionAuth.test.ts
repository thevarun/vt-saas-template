import * as Sentry from '@sentry/nextjs';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCachedUser } from '@/libs/supabase/cached-user';

import { withActionAuth, withActionAuthNoInput } from './withActionAuth';

vi.mock('@sentry/nextjs', () => ({
  setUser: vi.fn(),
}));

vi.mock('@/libs/supabase/cached-user', () => ({
  getCachedUser: vi.fn(),
}));

const mockGetCachedUser = vi.mocked(getCachedUser);
const mockSetUser = vi.mocked(Sentry.setUser);

// Minimal stand-ins — the wrappers only ever read `user.id` and pass `supabase`
// straight through to the handler, so we don't need full fidelity here.
const fakeUser = { id: 'user-123' } as User;
const fakeSupabase = { from: vi.fn() } as unknown as Awaited<ReturnType<typeof getCachedUser>>['supabase'];

function asAuthenticated() {
  mockGetCachedUser.mockResolvedValue({
    user: fakeUser,
    error: null,
    supabase: fakeSupabase,
  } as Awaited<ReturnType<typeof getCachedUser>>);
}

function asUnauthenticated(error: unknown = null) {
  mockGetCachedUser.mockResolvedValue({
    user: null,
    error,
    supabase: fakeSupabase,
  } as Awaited<ReturnType<typeof getCachedUser>>);
}

describe('withActionAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNAUTHORIZED ActionResult when no user is present', async () => {
    asUnauthenticated();
    const handler = vi.fn();

    const wrapped = withActionAuth(handler);
    const result = await wrapped({ foo: 'bar' });

    expect(result).toEqual({
      data: null,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
    expect(handler).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('returns UNAUTHORIZED ActionResult when getCachedUser surfaces an auth error', async () => {
    asUnauthenticated(new Error('session expired'));
    const handler = vi.fn();

    const wrapped = withActionAuth(handler);
    const result = await wrapped(undefined);

    expect(result).toEqual({
      data: null,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('invokes handler with the authenticated user, supabase client, and input', async () => {
    asAuthenticated();
    const handler = vi.fn(async () => ({ data: 'ok', error: null }));

    const wrapped = withActionAuth<{ id: string }, string>(handler);
    const result = await wrapped({ id: 'post-1' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      { user: fakeUser, supabase: fakeSupabase },
      { id: 'post-1' },
    );
    expect(result).toEqual({ data: 'ok', error: null });
  });

  it('sets the Sentry user scope to the authenticated user id', async () => {
    asAuthenticated();
    const handler = vi.fn(async () => ({ data: null, error: null }));

    const wrapped = withActionAuth(handler);
    await wrapped(undefined);

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' });
  });

  it('propagates an error ActionResult returned by the handler', async () => {
    asAuthenticated();
    const handler = vi.fn(async () => ({
      data: null,
      error: { message: 'boom', code: 'INTERNAL_ERROR' as const },
    }));

    const wrapped = withActionAuth(handler);
    const result = await wrapped(undefined);

    expect(result).toEqual({
      data: null,
      error: { message: 'boom', code: 'INTERNAL_ERROR' },
    });
  });
});

describe('withActionAuthNoInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns UNAUTHORIZED ActionResult when no user is present', async () => {
    asUnauthenticated();
    const handler = vi.fn();

    const wrapped = withActionAuthNoInput(handler);
    const result = await wrapped();

    expect(result).toEqual({
      data: null,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('invokes handler with only the auth context (no input)', async () => {
    asAuthenticated();
    const handler = vi.fn(async () => ({ data: 42, error: null }));

    const wrapped = withActionAuthNoInput<number>(handler);
    const result = await wrapped();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ user: fakeUser, supabase: fakeSupabase });
    expect(result).toEqual({ data: 42, error: null });
  });

  it('sets the Sentry user scope to the authenticated user id', async () => {
    asAuthenticated();
    const handler = vi.fn(async () => ({ data: null, error: null }));

    const wrapped = withActionAuthNoInput(handler);
    await wrapped();

    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-123' });
  });
});
