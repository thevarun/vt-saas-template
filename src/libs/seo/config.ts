/**
 * Site URL Configuration for SEO
 *
 * Thin wrapper around getBaseUrl() that also accepts NEXT_PUBLIC_SITE_URL
 * as a higher-priority override for SEO-specific configuration.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL env var (explicit SEO override)
 * 2. getBaseUrl() which checks: NEXT_PUBLIC_APP_URL, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL, localhost
 */

import { getBaseUrl } from '@/utils/Helpers';

/**
 * Get the absolute site URL for SEO purposes (hreflang, Open Graph, sitemaps)
 *
 * @returns Absolute site URL without trailing slash
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  return getBaseUrl();
}
