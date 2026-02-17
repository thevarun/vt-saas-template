import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as config from './config';
import {
  buildOgImageUrl,
  generateOpenGraphMetadata,
  generateSocialMetadata,
  generateTwitterMetadata,
} from './opengraph';

describe('generateOpenGraphMetadata', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns correct OG structure with required fields', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(og).toMatchObject({
      type: 'website',
      siteName: 'VT SaaS Template',
      title: 'Test Page',
      description: 'Test description',
    });
  });

  it('sets og:type to website', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (og && typeof og === 'object' && 'type' in og) {
      expect(og.type).toBe('website');
    }
  });

  it('includes site name', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    expect(og?.siteName).toBe('VT SaaS Template');
  });

  it('uses dynamic OG image by default', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (og && Array.isArray(og.images)) {
      const firstImage = og.images[0];
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        // Should use dynamic OG image endpoint with title and description
        expect(firstImage.url).toContain('/api/og');
        expect(firstImage.url).toContain('title=Test');
        expect(firstImage.url).toContain('description=Test');
      }
    }
  });

  it('includes image dimensions (1200x630)', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (og && Array.isArray(og.images)) {
      expect(og.images[0]).toMatchObject({
        width: 1200,
        height: 630,
      });
    }
  });

  it('uses custom image when provided', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
      image: '/custom-image.png',
    });

    if (og && Array.isArray(og.images)) {
      const firstImage = og.images[0];
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        expect(firstImage.url).toBe('https://example.com/custom-image.png');
      }
    }
  });

  it('includes path in og:url', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
      path: '/about',
    });

    expect(og?.url).toBe('https://example.com/about');
  });

  it('uses default path (empty) when not provided', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    expect(og?.url).toBe('https://example.com');
  });

  it('includes image alt text from title', () => {
    const og = generateOpenGraphMetadata({
      title: 'My Page Title',
      description: 'Test',
    });

    if (og && Array.isArray(og.images)) {
      const firstImage = og.images[0];
      if (firstImage && typeof firstImage === 'object' && 'alt' in firstImage) {
        expect(firstImage.alt).toBe('My Page Title');
      }
    }
  });
});

describe('generateTwitterMetadata', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses summary_large_image card type', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (twitter && typeof twitter === 'object' && 'card' in twitter) {
      expect(twitter.card).toBe('summary_large_image');
    }
  });

  it('includes title and description', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(twitter).toMatchObject({
      title: 'Test Page',
      description: 'Test description',
    });
  });

  it('uses dynamic OG image by default', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (twitter && Array.isArray(twitter.images)) {
      // Should use dynamic OG image endpoint with title and description
      expect(twitter.images[0]).toContain('/api/og');
      expect(twitter.images[0]).toContain('title=Test');
      expect(twitter.images[0]).toContain('description=Test');
    }
  });

  it('uses custom image when provided', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
      image: '/custom-twitter.png',
    });

    if (twitter && Array.isArray(twitter.images)) {
      expect(twitter.images[0]).toBe('https://example.com/custom-twitter.png');
    }
  });

  it('uses dynamic image when not provided', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (twitter && Array.isArray(twitter.images)) {
      // Should use dynamic OG image endpoint
      expect(twitter.images[0]).toContain('/api/og');
    }
  });
});

describe('generateSocialMetadata', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('combines OG and Twitter metadata', () => {
    const metadata = generateSocialMetadata({
      title: 'Test',
      description: 'Test',
    });

    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
  });

  it('uses same title and description for both', () => {
    const metadata = generateSocialMetadata({
      title: 'Test Page',
      description: 'Test description',
    });

    expect(metadata.openGraph?.title).toBe('Test Page');
    expect(metadata.twitter?.title).toBe('Test Page');
    expect(metadata.openGraph?.description).toBe('Test description');
    expect(metadata.twitter?.description).toBe('Test description');
  });

  it('uses same image for both', () => {
    const metadata = generateSocialMetadata({
      title: 'Test',
      description: 'Test',
      image: '/custom.png',
    });

    if (
      metadata.openGraph
      && Array.isArray(metadata.openGraph.images)
      && metadata.twitter
      && Array.isArray(metadata.twitter.images)
    ) {
      const ogImage = metadata.openGraph.images[0];

      if (ogImage && typeof ogImage === 'object' && 'url' in ogImage) {
        expect(ogImage.url).toBe('https://example.com/custom.png');
      }

      expect(metadata.twitter.images[0]).toBe('https://example.com/custom.png');
    }
  });

  it('passes path to OG metadata', () => {
    const metadata = generateSocialMetadata({
      title: 'Test',
      description: 'Test',
      path: '/blog',
    });

    expect(metadata.openGraph?.url).toBe('https://example.com/blog');
  });
});

describe('buildOgImageUrl', () => {
  beforeEach(() => {
    vi.spyOn(config, 'getSiteUrl').mockReturnValue('https://example.com');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns base URL without params', () => {
    const url = buildOgImageUrl();

    expect(url).toBe('https://example.com/api/og');
  });

  it('includes title param', () => {
    const url = buildOgImageUrl({ title: 'Dashboard' });

    expect(url).toBe('https://example.com/api/og?title=Dashboard');
  });

  it('includes description param', () => {
    const url = buildOgImageUrl({ description: 'User dashboard' });

    expect(url).toBe('https://example.com/api/og?description=User+dashboard');
  });

  it('includes title and description params', () => {
    const url = buildOgImageUrl({
      title: 'Dashboard',
      description: 'User dashboard',
    });

    expect(url).toContain('title=Dashboard');
    expect(url).toContain('description=User+dashboard');
  });

  it('URL encodes special characters', () => {
    const url = buildOgImageUrl({ title: 'Hello & Welcome!' });

    expect(url).toContain('Hello+%26+Welcome%21');
  });

  it('handles empty strings', () => {
    const url = buildOgImageUrl({ title: '', description: '' });

    expect(url).toBe('https://example.com/api/og');
  });

  it('handles Unicode characters', () => {
    const url = buildOgImageUrl({ title: 'नमस्ते 🙏' });

    expect(url).toContain('api/og?title=');

    // URLSearchParams encodes spaces as +, which becomes + in decoded URL, not space
    const decoded = decodeURIComponent(url).replace(/\+/g, ' ');

    expect(decoded).toContain('नमस्ते 🙏');
  });
});
