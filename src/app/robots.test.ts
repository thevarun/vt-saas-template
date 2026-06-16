import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as seoConfig from '@/libs/seo/config';

import robots from './robots';

vi.mock('@/libs/seo/config');
vi.mock('@/utils/AppConfig', () => ({
  AllLocales: ['en', 'hi', 'bn'],
  AppConfig: { defaultLocale: 'en' },
}));

const baseProtected = [
  '/dashboard',
  '/admin',
  '/api',
  '/onboarding',
  '/chat',
  '/sign-out',
  '/design-system',
  '/dev-sign-in',
];

describe('robots', () => {
  beforeEach(() => {
    vi.spyOn(seoConfig, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  it('allows crawling the site root', () => {
    const result = robots();

    expect((result.rules as { allow: string }).allow).toBe('/');
  });

  it('emits the bare protected paths (default locale, unprefixed)', () => {
    const result = robots();
    const disallow = (result.rules as { disallow: string[] }).disallow;

    for (const path of baseProtected) {
      expect(disallow).toContain(path);
    }
  });

  it('emits locale-prefixed disallow paths for every non-default locale', () => {
    const result = robots();
    const disallow = (result.rules as { disallow: string[] }).disallow;

    for (const locale of ['hi', 'bn']) {
      for (const path of baseProtected) {
        expect(disallow).toContain(`/${locale}${path}`);
      }
    }
  });

  it('does not emit redundant /en/ prefixed paths for the default locale', () => {
    const result = robots();
    const disallow = (result.rules as { disallow: string[] }).disallow;

    expect(disallow).not.toContain('/en/dashboard');
    expect(disallow).not.toContain('/en/admin');
    expect(disallow).not.toContain('/en/api');
  });

  it('includes the sitemap URL', () => {
    const result = robots();

    expect(result.sitemap).toBe('https://example.com/sitemap.xml');
  });

  it('emits the expected total disallow count (bare + non-default locales)', () => {
    const result = robots();
    const disallow = (result.rules as { disallow: string[] }).disallow;

    // 8 bare + 8 hi + 8 bn = 24
    expect(disallow).toHaveLength(baseProtected.length * 3);
  });
});
