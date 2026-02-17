import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/libs/seo/config';

/**
 * Robots.txt configuration for search engine crawlers
 *
 * ALLOWED ROUTES (Allow: /):
 * - All public pages are crawlable by default
 * - Specific public routes: /, /sign-in, /sign-up (unless explicitly disallowed)
 *
 * DISALLOWED ROUTES:
 * - /dashboard - Authenticated user dashboard and all sub-routes
 * - /admin - Admin panel (should never be indexed)
 * - /api - API endpoints (not HTML pages)
 * - /onboarding - User onboarding wizard (auth-only)
 * - /chat - Chat interface (auth-only)
 * - /sign-out - Sign out utility page (no content value)
 * - /design-system - Internal design reference
 *
 * Note: Disallow directives apply to the path and all sub-paths
 * (e.g., /dashboard also blocks /dashboard/settings)
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/admin',
        '/api',
        '/onboarding',
        '/chat',
        '/sign-out',
        '/design-system',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
