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

  it('includes x-default pointing to unprefixed default locale URL', () => {
    const links = generateHreflangLinks('/');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    // x-default uses unprefixed URL (same as default locale)
    expect(xDefault?.href).toBe('https://example.com');
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

    // Default locale (en) is unprefixed per localePrefix: 'as-needed'
    expect(enLink?.href).toBe('https://example.com/about');
    expect(hiLink?.href).toBe('https://example.com/hi/about');
    expect(bnLink?.href).toBe('https://example.com/bn/about');
  });

  it('strips existing locale prefix from pathname', () => {
    const links = generateHreflangLinks('/hi/about');
    const enLink = links.find(l => l.hreflang === 'en');
    const hiLink = links.find(l => l.hreflang === 'hi');

    expect(enLink?.href).toBe('https://example.com/about');
    expect(hiLink?.href).toBe('https://example.com/hi/about');
  });

  it('handles root path correctly', () => {
    const links = generateHreflangLinks('/');
    const enLink = links.find(l => l.hreflang === 'en');
    const xDefault = links.find(l => l.hreflang === 'x-default');

    // Default locale and x-default are unprefixed
    expect(enLink?.href).toBe('https://example.com');
    expect(xDefault?.href).toBe('https://example.com');
  });

  it('handles root path with locale prefix', () => {
    const links = generateHreflangLinks('/en');
    const enLink = links.find(l => l.hreflang === 'en');
    const hiLink = links.find(l => l.hreflang === 'hi');

    expect(enLink?.href).toBe('https://example.com');
    expect(hiLink?.href).toBe('https://example.com/hi');
  });

  it('handles deeply nested paths', () => {
    const links = generateHreflangLinks('/pricing/plans/enterprise');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/pricing/plans/enterprise');
  });

  it('handles paths with trailing slash', () => {
    const links = generateHreflangLinks('/about/');
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink?.href).toBe('https://example.com/about/');
  });

  it('includes self-referential hreflang for each locale', () => {
    const links = generateHreflangLinks('/en/about');

    // Default locale (en) is unprefixed, others have locale prefix
    const enLink = links.find(l => l.hreflang === 'en');

    expect(enLink).toBeDefined();
    expect(enLink?.href).toBe('https://example.com/about');

    const hiLink = links.find(l => l.hreflang === 'hi');

    expect(hiLink).toBeDefined();
    expect(hiLink?.href).toContain('/hi/about');

    const bnLink = links.find(l => l.hreflang === 'bn');

    expect(bnLink).toBeDefined();
    expect(bnLink?.href).toContain('/bn/about');
  });
});
