import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as config from './config';
import {
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

  it('uses absolute URL for images', () => {
    const og = generateOpenGraphMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (og && Array.isArray(og.images)) {
      const firstImage = og.images[0];
      if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
        expect(firstImage.url).toBe('https://example.com/og-image.png');
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

  it('uses absolute URL for images', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (twitter && Array.isArray(twitter.images)) {
      expect(twitter.images[0]).toBe('https://example.com/og-image.png');
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

  it('uses default image when not provided', () => {
    const twitter = generateTwitterMetadata({
      title: 'Test',
      description: 'Test',
    });

    if (twitter && Array.isArray(twitter.images)) {
      expect(twitter.images[0]).toBe('https://example.com/og-image.png');
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
