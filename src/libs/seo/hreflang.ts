/**
 * Hreflang Link Generation for SEO
 *
 * Generates hreflang alternate links for multilingual SEO.
 * Tells search engines which language variants exist for each page.
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import { AllLocales, AppConfig } from '@/utils/AppConfig';

import { getSiteUrl } from './config';

/**
 * Hreflang link object for Next.js Metadata API
 */
export type HreflangLink = {
  hreflang: string;
  href: string;
};

/**
 * Generate hreflang alternate links for a given pathname
 *
 * Creates alternate links for all supported locales (en, hi, bn) plus x-default.
 * Uses absolute URLs with site domain from getSiteUrl().
 *
 * @param pathname - Current page pathname (with or without locale prefix)
 * @returns Array of hreflang link objects
 *
 * @example
 * // Root page
 * generateHreflangLinks('/') // [
 * //   { hreflang: 'en', href: 'https://example.com/en' },
 * //   { hreflang: 'hi', href: 'https://example.com/hi' },
 * //   { hreflang: 'bn', href: 'https://example.com/bn' },
 * //   { hreflang: 'x-default', href: 'https://example.com/en' }
 * // ]
 *
 * @example
 * // Nested page
 * generateHreflangLinks('/about') // [
 * //   { hreflang: 'en', href: 'https://example.com/en/about' },
 * //   { hreflang: 'hi', href: 'https://example.com/hi/about' },
 * //   { hreflang: 'bn', href: 'https://example.com/bn/about' },
 * //   { hreflang: 'x-default', href: 'https://example.com/en/about' }
 * // ]
 *
 * @example
 * // Page with existing locale prefix
 * generateHreflangLinks('/hi/about') // Same as above - locale prefix is stripped
 */
export function generateHreflangLinks(pathname: string): HreflangLink[] {
  const siteUrl = getSiteUrl();

  // Strip existing locale prefix if present (dynamically derived from AllLocales)
  const localePattern = new RegExp(`^\\/(${AllLocales.join('|')})(\/|$)`);
  const cleanPathname = pathname.replace(localePattern, '/');

  // Generate alternate for each locale
  const links: HreflangLink[] = AllLocales.map(locale => ({
    hreflang: locale,
    href: `${siteUrl}/${locale}${cleanPathname === '/' ? '' : cleanPathname}`,
  }));

  // Add x-default pointing to English (default locale)
  links.push({
    hreflang: 'x-default',
    href: `${siteUrl}/${AppConfig.defaultLocale}${cleanPathname === '/' ? '' : cleanPathname}`,
  });

  return links;
}
