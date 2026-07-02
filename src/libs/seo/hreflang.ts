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
 * // Root page (default locale unprefixed per localePrefix: 'as-needed')
 * generateHreflangLinks('/') // [
 * //   { hreflang: 'en', href: 'https://example.com' },
 * //   { hreflang: 'hi', href: 'https://example.com/hi' },
 * //   { hreflang: 'bn', href: 'https://example.com/bn' },
 * //   { hreflang: 'x-default', href: 'https://example.com' }
 * // ]
 *
 * @example
 * // Nested page
 * generateHreflangLinks('/about') // [
 * //   { hreflang: 'en', href: 'https://example.com/about' },
 * //   { hreflang: 'hi', href: 'https://example.com/hi/about' },
 * //   { hreflang: 'bn', href: 'https://example.com/bn/about' },
 * //   { hreflang: 'x-default', href: 'https://example.com/about' }
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
  // Default locale is unprefixed per localePrefix: 'as-needed'
  const links: HreflangLink[] = AllLocales.map((locale) => {
    const isDefaultLocale = locale === AppConfig.defaultLocale;
    const localePrefix = isDefaultLocale ? '' : `/${locale}`;
    return {
      hreflang: locale,
      href: `${siteUrl}${localePrefix}${cleanPathname === '/' ? '' : cleanPathname}`,
    };
  });

  // Add x-default pointing to default locale (unprefixed canonical URL)
  links.push({
    hreflang: 'x-default',
    href: `${siteUrl}${cleanPathname === '/' ? '' : cleanPathname}`,
  });

  return links;
}

/**
 * Hreflang links shaped for Next.js `Metadata.alternates.languages` — a
 * `{ [hreflang]: href }` map. Thin wrapper over {@link generateHreflangLinks}
 * so every page builds the same map the same way instead of copy-pasting the
 * reduce into each `generateMetadata`.
 */
export function generateHreflangAlternates(pathname: string): Record<string, string> {
  return generateHreflangLinks(pathname).reduce<Record<string, string>>(
    (acc, link) => {
      acc[link.hreflang] = link.href;
      return acc;
    },
    {},
  );
}
