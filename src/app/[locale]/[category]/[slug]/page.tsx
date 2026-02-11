/**
 * Programmatic SEO (pSEO) Page Route
 *
 * This route demonstrates a programmatic SEO pattern for generating
 * data-driven pages at scale. Perfect for content marketing and
 * capturing long-tail search traffic.
 *
 * KEY FEATURES:
 * - Static generation at build time (generateStaticParams)
 * - Dynamic metadata for SEO (generateMetadata)
 * - Structured data for rich snippets
 * - Internal linking with breadcrumbs and related pages
 * - Social sharing integration
 *
 * HOW IT WORKS:
 * 1. generateStaticParams tells Next.js which pages to pre-render
 * 2. generateMetadata creates unique SEO tags for each page
 * 3. Page component fetches data and renders content
 *
 * CUSTOMIZATION:
 * - Update data files in data/pseo/
 * - Modify components in src/components/pseo/
 * - Adjust metadata strategy as needed
 * - Add analytics tracking (Epic 9)
 *
 * SCALING:
 * - For 1000+ pages, consider:
 *   - Moving data to database
 *   - Implementing ISR (Incremental Static Regeneration)
 *   - Adding CDN caching
 *   - Pagination for related content
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PseoTemplate } from '@/components/pseo';
import {
  getAllPageParams,
  getCategoryBySlug,
  getPageBySlug,
  getRelatedPages,
} from '@/libs/pseo/data';
import { getBaseUrl } from '@/utils/Helpers';

type PseoPageProps = {
  params: Promise<{
    locale: string;
    category: string;
    slug: string;
  }>;
};

/**
 * Generate static params for all pSEO pages
 *
 * This tells Next.js which pages to pre-render at build time.
 * All pages are generated during the build process for maximum performance.
 *
 * IMPORTANT: This runs at build time, not runtime.
 */
export async function generateStaticParams() {
  const allParams = await getAllPageParams();

  // Return all category/slug combinations
  // Next.js will generate a page for each one
  return allParams;
}

/**
 * Generate metadata for SEO
 *
 * Creates unique title, description, and Open Graph tags for each page.
 * This is critical for search engine visibility and social sharing.
 *
 * CUSTOMIZATION:
 * - Add Twitter Card tags
 * - Include canonical URLs
 * - Add article:published_time
 * - Include author information
 */
export async function generateMetadata(props: PseoPageProps): Promise<Metadata> {
  const params = await props.params;
  const { category: categorySlug, slug, locale } = params;

  const page = await getPageBySlug(categorySlug, slug);
  const category = await getCategoryBySlug(categorySlug);

  if (!page || !category) {
    return {
      title: 'Page Not Found',
    };
  }

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/${locale}/${categorySlug}/${slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    openGraph: {
      title: page.title,
      description: page.description,
      url: pageUrl,
      siteName: 'VT SaaS Template', // TODO: Update with your site name
      locale,
      type: 'article',
      publishedTime: page.lastModified,
      // TODO: Add article:modified_time when pages are updated
      // TODO: Add article:author
      // TODO: Add images from page content or default OG image
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      // TODO: Add twitter:image
      // TODO: Add twitter:creator if applicable
    },
    alternates: {
      canonical: pageUrl,
    },
    // Mark page as indexable (opposite of share pages which are noindex)
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

/**
 * Page component
 *
 * Renders the pSEO page with all content and components.
 * This is a Server Component, so all data fetching happens on the server.
 */
export default async function PseoPage(props: PseoPageProps) {
  const params = await props.params;
  const { category: categorySlug, slug, locale } = params;

  // Fetch page data
  const [page, category] = await Promise.all([
    getPageBySlug(categorySlug, slug),
    getCategoryBySlug(categorySlug),
  ]);

  // Show 404 if page or category doesn't exist
  if (!page || !category) {
    notFound();
  }

  // Fetch related pages (same category, excluding current page)
  const relatedPages = await getRelatedPages(categorySlug, slug, 3);

  // TODO: Epic 9 - Track page view analytics
  // Example: await trackPageView({ pageId: page.id, category: category.id })

  return (
    <PseoTemplate
      page={page}
      category={category}
      relatedPages={relatedPages}
      locale={locale}
    />
  );
}
