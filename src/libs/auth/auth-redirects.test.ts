import { describe, expect, it } from 'vitest';

import { buildSignInUrl, resolveLocaleFromCookie } from './auth-redirects';

describe('buildSignInUrl', () => {
  it('omits the locale prefix for the default locale', () => {
    const url = buildSignInUrl({ locale: 'en', redirect: '/en/dashboard' });

    expect(url).toBe('/sign-in?redirect=%2Fen%2Fdashboard');
  });

  it('prefixes the locale for non-default locales (as-needed)', () => {
    const url = buildSignInUrl({ locale: 'hi', redirect: '/hi/dashboard' });

    expect(url).toBe('/hi/sign-in?redirect=%2Fhi%2Fdashboard');
  });

  it('emits the redirect param the sign-in form reads', () => {
    const url = buildSignInUrl({ locale: 'en', redirect: '/en/settings' });
    const params = new URL(url, 'http://localhost').searchParams;

    expect(params.get('redirect')).toBe('/en/settings');
  });
});

describe('resolveLocaleFromCookie', () => {
  it('returns the cookie value when it is a known locale', () => {
    expect(resolveLocaleFromCookie('hi')).toBe('hi');
  });

  it('falls back to the default locale for an unknown value', () => {
    expect(resolveLocaleFromCookie('zz')).toBe('en');
  });

  it('falls back to the default locale when undefined', () => {
    expect(resolveLocaleFromCookie(undefined)).toBe('en');
  });
});
