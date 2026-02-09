/**
 * Open Graph & Twitter Card Metadata Generation
 *
 * Utilities for generating social media metadata for Next.js pages.
 * Provides consistent Open Graph and Twitter Card tags across the application.
 */

import type { Metadata } from 'next';

import { getSiteUrl } from './config';
import { DEFAULT_OG_IMAGE, SITE_NAME } from './constants';

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
};

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
  const { title, description, image = DEFAULT_OG_IMAGE, path = '' } = params;
  const siteUrl = getSiteUrl();

  return {
    type: 'website',
    siteName: SITE_NAME,
    title,
    description,
    url: `${siteUrl}${path}`,
    images: [
      {
        url: `${siteUrl}${image}`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };
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
  const { title, description, image = DEFAULT_OG_IMAGE } = params;
  const siteUrl = getSiteUrl();

  return {
    card: 'summary_large_image',
    title,
    description,
    images: [`${siteUrl}${image}`],
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
