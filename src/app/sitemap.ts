import type { MetadataRoute } from 'next';

import { getAllCategoryParams, getAllPageParams, getPageBySlug } from '@/libs/pseo/data';
import { getSiteUrl } from '@/libs/seo/config';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Route Classification:
 *
 * PUBLIC ROUTES (included in sitemap):
 * - / (landing page)
 * - /articles (pSEO index)
 * - /articles/[category] (pSEO category pages)
 * - /articles/[category]/[slug] (pSEO article pages)
 * - Future: /about, /pricing, /blog/[slug], /docs/[...path]
 *
 * PRIVATE ROUTES (excluded from sitemap, disallowed in robots.txt):
 * - /dashboard (auth required)
 * - /admin/* (admin role required)
 * - /onboarding (auth required)
 * - /chat/* (auth required)
 * - /sign-out (utility page)
 * - /design-system (internal reference)
 *
 * API ROUTES (excluded from sitemap, disallowed in robots.txt):
 * - /api/* (not HTML pages)
 *
 * AUTH PAGES (currently excluded - minimal SEO value):
 * - /sign-in, /sign-up, /forgot-password
 * - Future consideration: Include if signup/login should be discoverable via search
 *
 * HOW TO ADD NEW PUBLIC ROUTES:
 * 1. Add the path to the publicRoutes array below
 * 2. Set appropriate changeFrequency and priority
 * 3. Sitemap auto-regenerates on deployment (no manual sitemap.xml editing needed)
 */

/**
 * Generate sitemap entries for a route across all supported locales
 *
 * @param path - Route path (e.g., '/', '/about', '/pricing')
 * @param options - Sitemap options
 * @param options.changeFrequency - How frequently the page is expected to change
 * @param options.priority - Priority of this URL relative to other URLs on the site (0.0-1.0)
 * @returns Array of sitemap entries (one per locale)
 */
function generateLocalizedUrls(
  path: string,
  options: {
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  } = {},
): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const { changeFrequency = 'weekly', priority = 0.8 } = options;

  // Default locale is unprefixed per localePrefix: 'as-needed'
  return AllLocales.map((locale) => {
    const isDefaultLocale = locale === AppConfig.defaultLocale;
    const localePrefix = isDefaultLocale ? '' : `/${locale}`;
    return {
      url: `${siteUrl}${localePrefix}${path === '/' ? '' : path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Public routes that should be indexed by search engines
  const publicRoutes: Array<{
    path: string;
    changeFrequency?: MetadataRoute.Sitemap[0]['changeFrequency'];
    priority?: number;
  }> = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    // Future: Add /about, /pricing, /blog, etc.
  ];

  // Generate localized entries for all public routes
  const entries: MetadataRoute.Sitemap = [];

  for (const route of publicRoutes) {
    entries.push(
      ...generateLocalizedUrls(route.path, {
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    );
  }

  // Articles index and category pages (pSEO)
  const categoryParams = await getAllCategoryParams();
  for (const param of categoryParams) {
    entries.push(
      ...generateLocalizedUrls(`/articles/${param.category}`, {
        changeFrequency: 'weekly',
        priority: 0.7,
      }),
    );
  }

  // Articles index page
  entries.push(
    ...generateLocalizedUrls('/articles', {
      changeFrequency: 'weekly',
      priority: 0.8,
    }),
  );

  // pSEO article pages
  const pseoParams = await getAllPageParams();
  const siteUrl = getSiteUrl();

  for (const param of pseoParams) {
    const page = await getPageBySlug(param.category, param.slug);
    if (page) {
      for (const locale of AllLocales) {
        const isDefaultLocale = locale === AppConfig.defaultLocale;
        const localePrefix = isDefaultLocale ? '' : `/${locale}`;
        entries.push({
          url: `${siteUrl}${localePrefix}/articles/${param.category}/${param.slug}`,
          lastModified: new Date(page.lastModified),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}
