import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/libs/seo/config';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Robots.txt configuration for search engine crawlers
 *
 * ALLOWED ROUTES (Allow: /):
 * - All public pages are crawlable by default
 * - Specific public routes: /, /sign-in, /sign-up (unless explicitly disallowed)
 *
 * DISALLOWED ROUTES (the protected set):
 * - /dashboard - Authenticated user dashboard and all sub-routes
 * - /admin - Admin panel (should never be indexed)
 * - /api - API endpoints (not HTML pages)
 * - /onboarding - User onboarding wizard (auth-only)
 * - /chat - Chat interface (auth-only)
 * - /sign-out - Sign out utility page (no content value)
 * - /design-system - Internal design reference
 * - /dev-sign-in - Dev-only auth page (no content value)
 *
 * Note: Disallow directives apply to the path and all sub-paths
 * (e.g., /dashboard also blocks /dashboard/settings)
 *
 * Locale prefixes: next-intl uses `localePrefix: 'as-needed'`, so the default
 * locale (`en`) serves at unprefixed paths (e.g. `/dashboard`) while non-default
 * locales serve at `/hi/dashboard`, `/bn/dashboard`, etc. Both forms must be
 * disallowed, so we cartesian-product `AllLocales` (minus the default) with the
 * protected paths.
 */
const protectedPaths = [
  '/dashboard',
  '/admin',
  '/api',
  '/onboarding',
  '/chat',
  '/sign-out',
  '/design-system',
  '/dev-sign-in',
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const nonDefaultLocales = AllLocales.filter(
    locale => locale !== AppConfig.defaultLocale,
  );

  const localizedDisallow = nonDefaultLocales.flatMap(locale =>
    protectedPaths.map(path => `/${locale}${path}`),
  );

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...protectedPaths, ...localizedDisallow],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
