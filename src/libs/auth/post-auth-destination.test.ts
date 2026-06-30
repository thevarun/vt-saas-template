import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { getPostAuthDestination } = await import('./post-auth-destination');

const maybeSingle = vi.fn();

/** Minimal chained supabase-js stub: `.from().select().eq().maybeSingle()`. */
function makeSupabase(): SupabaseClient<any, any, any> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  } as unknown as SupabaseClient<any, any, any>;
}

describe('getPostAuthDestination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes users without a preferences row to /onboarding', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'en',
      preferredPath: '/en/dashboard',
    });

    expect(dest).toBe('/en/onboarding');
  });

  it('honours a safe preferredPath for onboarded users', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: 'pref-1' }, error: null });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'en',
      preferredPath: '/en/settings',
    });

    expect(dest).toBe('/en/settings');
  });

  it('falls back to /dashboard when onboarded with no preferredPath', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: 'pref-1' }, error: null });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'hi',
    });

    expect(dest).toBe('/hi/dashboard');
  });

  it('rejects a protocol-relative preferredPath (open-redirect guard)', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: 'pref-1' }, error: null });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'en',
      preferredPath: '//evil.com',
    });

    expect(dest).toBe('/en/dashboard');
  });

  it('rejects an absolute external preferredPath (open-redirect guard)', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: 'pref-1' }, error: null });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'en',
      preferredPath: 'https://evil.com',
    });

    expect(dest).toBe('/en/dashboard');
  });

  it('fails open to the onboarded path when the lookup errors', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    const dest = await getPostAuthDestination({
      supabase: makeSupabase(),
      userId: 'user-1',
      locale: 'en',
      preferredPath: '/en/dashboard',
    });

    // Errors must not trap a returning user in onboarding.
    expect(dest).toBe('/en/dashboard');
  });

  it('fails open when the client throws synchronously', async () => {
    const throwingClient = {
      from: () => {
        throw new Error('client misconfigured');
      },
    } as unknown as SupabaseClient<any, any, any>;

    const dest = await getPostAuthDestination({
      supabase: throwingClient,
      userId: 'user-1',
      locale: 'en',
      preferredPath: '/en/dashboard',
    });

    expect(dest).toBe('/en/dashboard');
  });
});
