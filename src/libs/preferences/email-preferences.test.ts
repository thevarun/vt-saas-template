import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

const { getUserEmailPreferences } = await import('./email-preferences');

describe('getUserEmailPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the on default when the query errors', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    const prefs = await getUserEmailPreferences('user-1');

    expect(prefs).toEqual({ emailNotifications: true });
  });

  it('returns the on default when no row exists', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const prefs = await getUserEmailPreferences('user-1');

    expect(prefs).toEqual({ emailNotifications: true });
  });

  it('maps a present row', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { email_notifications: false }, error: null });

    const prefs = await getUserEmailPreferences('user-1');

    expect(prefs).toEqual({ emailNotifications: false });
  });

  it('falls back to the default when the column is null', async () => {
    maybeSingle.mockResolvedValueOnce({ data: { email_notifications: null }, error: null });

    const prefs = await getUserEmailPreferences('user-1');

    expect(prefs).toEqual({ emailNotifications: true });
  });

  it('passes a query error to the logger when provided', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const logger = { warn: vi.fn() };

    await getUserEmailPreferences('user-1', logger);

    expect(logger.warn).toHaveBeenCalled();
  });
});
