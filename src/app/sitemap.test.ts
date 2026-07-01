import type { MetadataRoute } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as seoConfig from '@/libs/seo/config';

import sitemap from './sitemap';

// Mock dependencies
vi.mock('@/libs/seo/config');
vi.mock('@/utils/AppConfig', () => ({
  AllLocales: ['en', 'hi', 'bn'],
  AppConfig: { defaultLocale: 'en' },
}));
vi.mock('@/libs/pseo/data', () => ({
  getAllCategoryParams: vi.fn().mockResolvedValue([]),
  getAllPageParams: vi.fn().mockResolvedValue([]),
  getPageBySlug: vi.fn().mockResolvedValue(null),
}));

describe('sitemap', () => {
  beforeEach(() => {
    vi.spyOn(seoConfig, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  it('generates entries for all locales', async () => {
    const entries = await sitemap();

    // 2 public routes (/ , /about) × 3 locales + 1 articles index × 3 locales
    // + 2 legal scaffolds (/terms, /privacy) default-locale only = 11 entries
    expect(entries).toHaveLength(11);
  });

  it('includes the /about page for all locales', async () => {
    const entries = await sitemap();
    const aboutEntries = entries.filter(e => e.url.endsWith('/about'));

    expect(aboutEntries).toHaveLength(3);

    aboutEntries.forEach((entry) => {
      expect(entry.priority).toBe(0.6);
      expect(entry.changeFrequency).toBe('monthly');
    });
  });

  it('includes legal scaffolds at the default locale only', async () => {
    const entries = await sitemap();
    const legalEntries = entries.filter(
      e => e.url.endsWith('/terms') || e.url.endsWith('/privacy'),
    );

    // One entry each — no /hi or /bn variants for legal pages.
    expect(legalEntries).toHaveLength(2);

    const legalUrls = legalEntries.map(e => e.url).sort();

    expect(legalUrls).toEqual([
      'https://example.com/privacy',
      'https://example.com/terms',
    ]);

    legalEntries.forEach((entry) => {
      expect(entry.url).not.toMatch(/\/(?:hi|bn)\//);
    });
  });

  it('uses absolute URLs', async () => {
    const entries = await sitemap();

    entries.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\//);
    });
  });

  it('includes all locales with default locale unprefixed', async () => {
    const entries = await sitemap();
    const urls = entries.map(e => e.url);

    // Default locale (en) is unprefixed per localePrefix: 'as-needed'
    expect(urls).toContain('https://example.com');
    expect(urls).toContain('https://example.com/hi');
    expect(urls).toContain('https://example.com/bn');
  });

  it('sets correct priority for homepage', async () => {
    const entries = await sitemap();

    // Homepage entries (the bare locale roots) should have priority 1.0
    const homepageUrls = [
      'https://example.com',
      'https://example.com/hi',
      'https://example.com/bn',
    ];
    const homepageEntries = entries.filter(e => homepageUrls.includes(e.url));

    expect(homepageEntries).toHaveLength(3);

    homepageEntries.forEach((entry) => {
      expect(entry.priority).toBe(1.0);
    });
  });

  it('sets correct changeFrequency for homepage', async () => {
    const entries = await sitemap();

    const homepageUrls = [
      'https://example.com',
      'https://example.com/hi',
      'https://example.com/bn',
    ];
    const homepageEntries = entries.filter(e => homepageUrls.includes(e.url));

    expect(homepageEntries).toHaveLength(3);

    homepageEntries.forEach((entry) => {
      expect(entry.changeFrequency).toBe('daily');
    });
  });

  it('includes lastModified for all entries', async () => {
    const entries = await sitemap();

    entries.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  it('validates priority values are within range', async () => {
    const entries = await sitemap();

    entries.forEach((entry) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0.0);
      expect(entry.priority).toBeLessThanOrEqual(1.0);
    });
  });

  it('validates changeFrequency values are valid', async () => {
    const entries = await sitemap();
    const validFrequencies: Array<MetadataRoute.Sitemap[0]['changeFrequency']>
      = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

    entries.forEach((entry) => {
      if (entry.changeFrequency) {
        expect(validFrequencies).toContain(entry.changeFrequency);
      }
    });
  });
});
