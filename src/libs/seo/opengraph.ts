/**
 * Open Graph & Twitter Card Metadata Generation
 *
 * Utilities for generating social media metadata for Next.js pages.
 * Provides consistent Open Graph and Twitter Card tags across the application.
 */

import type { Metadata } from 'next';

import { getSiteUrl } from './config';
import { OG_IMAGE_ENDPOINT, SITE_NAME } from './constants';

/**
 * Parameters for social metadata generation
 */
export type SocialMetadataParams = {
  /** Page title (used for og:title and twitter:title) */
  title: string;
  /** Page description (used for og:description and twitter:description) */
  description: string;
  /** Optional image path (defaults to DEFAULT_OG_IMAGE) */
  image?: string;
  /** Optional page path for og:url (defaults to '') */
  path?: string;
  /** og:type — defaults to 'website'. Use 'article' for editorial/blog pages. */
  type?: 'website' | 'article';
  /** ISO date string for og:article:published_time. Only emitted when type === 'article'. */
  publishedTime?: string;
  /** Locale code for og:locale (e.g. 'en', 'hi'). Omitted when unset. */
  locale?: string;
};

/**
 * Append the brand to a social-card title unless it already contains it.
 *
 * Em-dash (`—`) is the modern brand separator (Apple, Stripe, Linear). Pages
 * that already set their own brand — e.g. `Foo | VT SaaS Template` — are left
 * untouched via the `includes(SITE_NAME)` escape hatch, so this never
 * double-brands. Only `og:title` / `twitter:title` get this; the document
 * `<title>` stays each page's own concern.
 */
function withBrand(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
}

/**
 * Generate Open Graph metadata for social sharing
 *
 * @param params - Social metadata parameters
 * @returns Next.js Metadata openGraph object
 *
 * @example
 * ```typescript
 * const og = generateOpenGraphMetadata({
 *   title: 'My Page',
 *   description: 'Page description',
 *   path: '/my-page'
 * });
 * ```
 */
export function generateOpenGraphMetadata(
  params: SocialMetadataParams,
): Metadata['openGraph'] {
  const { title, description, image, path = '', type = 'website', publishedTime, locale } = params;
  const siteUrl = getSiteUrl();

  // Use provided image, or generate dynamic OG image, or fallback to static
  let imageUrl: string;
  if (image) {
    // Custom image provided - use it as-is
    imageUrl = `${siteUrl}${image}`;
  } else {
    // No custom image - use dynamic OG image generation
    imageUrl = buildOgImageUrl({ title, description });
  }

  const base = {
    siteName: SITE_NAME,
    title: withBrand(title),
    description,
    url: `${siteUrl}${path}`,
    ...(locale ? { locale } : {}),
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };

  // Article pages emit og:type=article and an optional published_time.
  // Default behavior is unchanged: og:type=website with no publishedTime.
  if (type === 'article') {
    return {
      ...base,
      type: 'article',
      ...(publishedTime ? { publishedTime } : {}),
    };
  }

  return { ...base, type: 'website' };
}

/**
 * Generate Twitter Card metadata for social sharing
 *
 * @param params - Social metadata parameters
 * @returns Next.js Metadata twitter object
 *
 * @example
 * ```typescript
 * const twitter = generateTwitterMetadata({
 *   title: 'My Page',
 *   description: 'Page description'
 * });
 * ```
 */
export function generateTwitterMetadata(
  params: SocialMetadataParams,
): Metadata['twitter'] {
  const { title, description, image } = params;
  const siteUrl = getSiteUrl();

  // Use provided image, or generate dynamic OG image, or fallback to static
  let imageUrl: string;
  if (image) {
    // Custom image provided - use it as-is
    imageUrl = `${siteUrl}${image}`;
  } else {
    // No custom image - use dynamic OG image generation
    imageUrl = buildOgImageUrl({ title, description });
  }

  return {
    card: 'summary_large_image',
    title: withBrand(title),
    description,
    images: [imageUrl],
  };
}

/**
 * Generate combined Open Graph and Twitter Card metadata
 *
 * Convenience function that generates both OG and Twitter metadata
 * in a single call. Use this for most pages to ensure consistent
 * social sharing metadata.
 *
 * @param params - Social metadata parameters
 * @returns Next.js Metadata object with openGraph and twitter fields
 *
 * @example
 * ```typescript
 * export async function generateMetadata(): Promise<Metadata> {
 *   return {
 *     title: 'My Page',
 *     description: 'Page description',
 *     ...generateSocialMetadata({
 *       title: 'My Page',
 *       description: 'Page description',
 *       path: '/my-page'
 *     })
 *   };
 * }
 * ```
 */
export function generateSocialMetadata(
  params: SocialMetadataParams,
): Metadata {
  return {
    openGraph: generateOpenGraphMetadata(params),
    twitter: generateTwitterMetadata(params),
  };
}

/**
 * Parameters for dynamic OG image generation
 */
export type OgImageOptions = {
  /** Optional page title to display in the image */
  title?: string;
  /** Optional page description to display in the image */
  description?: string;
};

/**
 * Build absolute URL for dynamic Open Graph image generation
 *
 * Constructs a URL to the dynamic OG image endpoint with query parameters.
 * The endpoint will generate a custom OG image based on the provided title
 * and description.
 *
 * @param options - Title and description for the image
 * @returns Absolute URL to OG image endpoint with query params
 *
 * @example
 * ```typescript
 * // Generate default OG image
 * const url = buildOgImageUrl();
 * // => https://example.com/api/og
 *
 * // Generate OG image with title
 * const url = buildOgImageUrl({ title: 'Dashboard' });
 * // => https://example.com/api/og?title=Dashboard
 *
 * // Generate OG image with title and description
 * const url = buildOgImageUrl({
 *   title: 'User Dashboard',
 *   description: 'View your analytics and stats'
 * });
 * // => https://example.com/api/og?title=User+Dashboard&description=View+your+analytics+and+stats
 * ```
 */
export function buildOgImageUrl(options: OgImageOptions = {}): string {
  const siteUrl = getSiteUrl();
  const params = new URLSearchParams();

  // Only add params if they have non-empty values
  if (options.title && options.title.trim()) {
    params.set('title', options.title);
  }

  if (options.description && options.description.trim()) {
    params.set('description', options.description);
  }

  const queryString = params.toString();
  return `${siteUrl}${OG_IMAGE_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
}
