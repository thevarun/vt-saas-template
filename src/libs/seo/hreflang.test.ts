import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as config from './config';
import { generateHreflangLinks } from './hreflang';

describe('generateHreflangLinks', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates links for all locales (en, hi, bn, x-default)', () => {
    const links = generateHreflangLinks('/');

    expect(links).toHaveLength(4); // en, hi, bn, x-default
    expect(links.map(l => l.hreflang)).toEqual(['en', 'hi', 'bn', 'x-default']);
  });

  it('includes x-default pointing to English version', () => {
    const links = generateHreflangLinks('/');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    expect(xDefault?.href).toBe('https://example.com/en');
  });

  it('uses absolute URLs with domain', () => {
    const links = generateHreflangLinks('/');

    links.forEach((link) => {
      expect(link.href).toMatch(/^https?:\/\//);
      expect(link.href).toContain('example.com');
    });
  });

  it('preserves pathname in alternates for nested pages', () => {
    const links = generateHreflangLinks('/about');
    const enLink = links.find(l => l.hreflang === 'en');
    const hiLink = links.find(l => l.hreflang === 'hi');
    const bnLink = links.find(l => l.hreflang === 'bn');

    expect(enLink?.href).toBe('https://example.com/en/about');
    expect(hiLink?.href).toBe('https://example.com/hi/about');
    expect(bnLink?.href).toBe('https://example.com/bn/about');
  });

  it('strips existing locale prefix from pathname', () => {
    const links = generateHreflangLinks('/hi/about');
    const enLink = links.find(l => l.hreflang === 'en');
    const hiLink = links.find(l => l.hreflang === 'hi');

    expect(enLink?.href).toBe('https://example.com/en/about');
    expect(hiLink?.href).toBe('https://example.com/hi/about');
  });

  it('handles root path correctly', () => {
    const links = generateHreflangLinks('/');
    const enLink = links.find(l => l.hreflang === 'en');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    expect(enLink?.href).toBe('https://example.com/en');
    expect(xDefault?.href).toBe('https://example.com/en');
  });

  it('handles root path with locale prefix', () => {
    const links = generateHreflangLinks('/en');
    const enLink = links.find(l => l.hreflang === 'en');
    const hiLink = links.find(l => l.hreflang === 'hi');

    expect(enLink?.href).toBe('https://example.com/en');
    expect(hiLink?.href).toBe('https://example.com/hi');
  });

  it('handles deeply nested paths', () => {
    const links = generateHreflangLinks('/pricing/plans/enterprise');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/en/pricing/plans/enterprise');
  });

  it('handles paths with trailing slash', () => {
    const links = generateHreflangLinks('/about/');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/en/about/');
  });

  it('includes self-referential hreflang for each locale', () => {
    const links = generateHreflangLinks('/en/about');

    const locales = ['en', 'hi', 'bn'];
    locales.forEach((locale) => {
      const link = links.find(l => l.hreflang === locale);

      expect(link).toBeDefined();
      expect(link?.href).toContain(`/${locale}/about`);
    });
  });
});
