// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import {
  buildLandingAuthUrl,
  redirectUnauthToLanding,
  resolveLocaleFromCookie,
} from './landing-auth-url';

// Parse a relative URL string for assertions (decodes query params).
function parse(relative: string): URL {
  return new URL(relative, 'http://localhost:3000');
}

function makeRequest(pathname: string, cookies?: Record<string, string>) {
  const req = new NextRequest(new URL(pathname, 'http://localhost:3000'));
  for (const [k, v] of Object.entries(cookies ?? {})) {
    req.cookies.set(k, v);
  }
  return req;
}

describe('buildLandingAuthUrl', () => {
  it('leaves the default locale (en) unprefixed', () => {
    const url = parse(buildLandingAuthUrl({ locale: 'en', redirect: '/dashboard' }));

    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('auth')).toBe('signin');
    expect(url.searchParams.get('redirect')).toBe('/dashboard');
  });

  it('prefixes a non-default locale', () => {
    const url = parse(buildLandingAuthUrl({ locale: 'hi', redirect: '/dashboard' }));

    expect(url.pathname).toBe('/hi');
    expect(url.searchParams.get('redirect')).toBe('/dashboard');
  });

  it('honours the tab (signup)', () => {
    const url = parse(buildLandingAuthUrl({ locale: 'en', redirect: '/x', tab: 'signup' }));

    expect(url.searchParams.get('auth')).toBe('signup');
  });

  it('preserves a deep-link query string through the redirect param round-trip', () => {
    const url = parse(buildLandingAuthUrl({ locale: 'en', redirect: '/settings?tab=billing' }));

    // The raw string must be percent-encoded so the inner `?`/`=` don't leak
    // into the landing URL's own query…
    expect(url.search).toContain('redirect=%2Fsettings%3Ftab%3Dbilling');
    // …and must decode back to the exact intended path.
    expect(url.searchParams.get('redirect')).toBe('/settings?tab=billing');
  });
});

describe('resolveLocaleFromCookie', () => {
  it('returns a valid locale from the cookie', () => {
    expect(resolveLocaleFromCookie('hi')).toBe('hi');
  });

  it('falls back to the default locale for an unknown value', () => {
    expect(resolveLocaleFromCookie('xx')).toBe('en');
  });

  it('falls back to the default locale when unset', () => {
    expect(resolveLocaleFromCookie(undefined)).toBe('en');
  });
});

describe('redirectUnauthToLanding', () => {
  it('redirects (307) to the landing with dialog-intent params', () => {
    const res = redirectUnauthToLanding(makeRequest('/dashboard'), '/dashboard');
    const loc = new URL(res.headers.get('location')!);

    expect(res.status).toBe(307);
    expect(loc.pathname).toBe('/');
    expect(loc.searchParams.get('auth')).toBe('signin');
    expect(loc.searchParams.get('redirect')).toBe('/dashboard');
  });

  it('derives the locale prefix from the request path', () => {
    const res = redirectUnauthToLanding(makeRequest('/hi/dashboard'), '/hi/dashboard');
    const loc = new URL(res.headers.get('location')!);

    expect(loc.pathname).toBe('/hi');
    expect(loc.searchParams.get('redirect')).toBe('/hi/dashboard');
  });

  it('falls back to the NEXT_LOCALE cookie when the path carries no locale', () => {
    const res = redirectUnauthToLanding(
      makeRequest('/dashboard', { NEXT_LOCALE: 'bn' }),
      '/dashboard',
    );
    const loc = new URL(res.headers.get('location')!);

    expect(loc.pathname).toBe('/bn');
  });

  it('preserves the intended query string and honours the signup tab', () => {
    const res = redirectUnauthToLanding(
      makeRequest('/settings'),
      '/settings?tab=billing',
      'signup',
    );
    const loc = new URL(res.headers.get('location')!);

    expect(loc.searchParams.get('auth')).toBe('signup');
    expect(loc.searchParams.get('redirect')).toBe('/settings?tab=billing');
  });
});
