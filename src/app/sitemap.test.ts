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

    // 1 public route × 3 locales + 1 articles index × 3 locales = 6 entries
    expect(entries).toHaveLength(6);
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

    // Homepage entries should have priority 1.0
    const homepageEntries = entries.filter(e => !e.url.includes('/articles'));
    homepageEntries.forEach((entry) => {
      expect(entry.priority).toBe(1.0);
    });
  });

  it('sets correct changeFrequency for homepage', async () => {
    const entries = await sitemap();

    const homepageEntries = entries.filter(e => !e.url.includes('/articles'));
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
    const validFrequencies: Array<MetadataRoute.Sitemap[0]['changeFrequency']> = [
      'always',
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'yearly',
      'never',
    ];

    entries.forEach((entry) => {
      if (entry.changeFrequency) {
        expect(validFrequencies).toContain(entry.changeFrequency);
      }
    });
  });
});
