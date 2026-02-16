import type { MetadataRoute } from 'next';

import { getAllCategoryParams, getAllPageParams, getPageBySlug } from '@/libs/pseo/data';
import { AppConfig } from '@/utils/AppConfig';
import { getBaseUrl } from '@/utils/Helpers';

/**
 * Sitemap Generation
 *
 * Generates a sitemap.xml file for search engines.
 * Includes static pages and all programmatic SEO pages.
 *
 * IMPORTANT:
 * - Runs at build time for static generation
 * - Include all public pages that should be indexed
 * - Exclude authenticated pages and share links
 *
 * CUSTOMIZATION:
 * - Add more static routes as needed
 * - Adjust priorities based on importance
 * - Add news sitemap for time-sensitive content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Add more static pages here as needed
    // Example:
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
  ];

  // Articles index and category pages
  const categoryParams = await getAllCategoryParams();
  const articlePages: MetadataRoute.Sitemap = [];

  for (const locale of AppConfig.locales) {
    // Articles index page
    articlePages.push({
      url: `${baseUrl}/${locale}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Category pages
    for (const param of categoryParams) {
      articlePages.push({
        url: `${baseUrl}/${locale}/articles/${param.category}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // pSEO pages - generate entries for all programmatic SEO pages
  const pseoParams = await getAllPageParams();
  const pseoPages: MetadataRoute.Sitemap = [];

  for (const locale of AppConfig.locales) {
    for (const param of pseoParams) {
      const page = await getPageBySlug(param.category, param.slug);
      if (page) {
        pseoPages.push({
          url: `${baseUrl}/${locale}/articles/${param.category}/${param.slug}`,
          lastModified: new Date(page.lastModified),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  // Combine all pages
  return [...staticPages, ...articlePages, ...pseoPages];
}
