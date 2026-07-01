import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateMetadata } from './page';

vi.mock('@/libs/pseo/data', () => ({
  loadCategories: vi.fn(async () => []),
  getPagesByCategory: vi.fn(async () => []),
}));

describe('blog index canonical', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('omits the locale segment for the default locale (matches sitemap)', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(metadata.alternates?.canonical).toBe('https://example.com/blog');
  });

  it('prefixes the locale segment for a non-default locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'hi' }),
    });

    expect(metadata.alternates?.canonical).toBe('https://example.com/hi/blog');
  });
});
