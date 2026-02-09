import type { MetadataRoute } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as seoConfig from '@/libs/seo/config';

import sitemap from './sitemap';

// Mock dependencies
vi.mock('@/libs/seo/config');
vi.mock('@/utils/AppConfig', () => ({
  AllLocales: ['en', 'hi', 'bn'],
}));

describe('sitemap', () => {
  beforeEach(() => {
    vi.spyOn(seoConfig, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  it('generates entries for all locales', () => {
    const entries = sitemap();

    // 1 public route × 3 locales = 3 entries
    expect(entries).toHaveLength(3);
  });

  it('uses absolute URLs', () => {
    const entries = sitemap();

    entries.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\//);
    });
  });

  it('includes all locales', () => {
    const entries = sitemap();
    const urls = entries.map(e => e.url);

    expect(urls).toContain('https://example.com/en');
    expect(urls).toContain('https://example.com/hi');
    expect(urls).toContain('https://example.com/bn');
  });

  it('sets correct priority for homepage', () => {
    const entries = sitemap();

    // All homepage entries should have priority 1.0
    entries.forEach((entry) => {
      expect(entry.priority).toBe(1.0);
    });
  });

  it('sets correct changeFrequency for homepage', () => {
    const entries = sitemap();

    entries.forEach((entry) => {
      expect(entry.changeFrequency).toBe('daily');
    });
  });

  it('includes lastModified for all entries', () => {
    const entries = sitemap();

    entries.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  it('validates priority values are within range', () => {
    const entries = sitemap();

    entries.forEach((entry) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0.0);
      expect(entry.priority).toBeLessThanOrEqual(1.0);
    });
  });

  it('validates changeFrequency values are valid', () => {
    const entries = sitemap();
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
