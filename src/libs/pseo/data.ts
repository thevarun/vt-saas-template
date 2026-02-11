/**
 * pSEO Data Loading Utilities
 *
 * This module provides functions to load and access programmatic SEO data.
 * Data is stored in JSON files in the data/pseo directory.
 *
 * PATTERN EXPLANATION:
 * - Static JSON files allow build-time static generation
 * - Data can be version-controlled alongside code
 * - Easy to update without database changes
 * - Perfect for content that changes infrequently
 *
 * CUSTOMIZATION:
 * 1. Update JSON files in data/pseo/ with your content
 * 2. Modify types below to match your data structure
 * 3. Add additional data files as needed
 * 4. Consider moving to database for frequently updated content
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Types for pSEO data structures
export type PseoCategory = {
  id: string;
  name: string;
  description: string;
  slug: string;
};

export type PseoPage = {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown content
  keywords: string[];
  lastModified: string;
};

// Cache for loaded data (populated at build time)
let categoriesCache: PseoCategory[] | null = null;
let pagesCache: PseoPage[] | null = null;

/**
 * Load categories from JSON file
 * Data is cached after first load for performance
 */
export async function loadCategories(): Promise<PseoCategory[]> {
  if (categoriesCache) {
    return categoriesCache;
  }

  const dataPath = join(process.cwd(), 'data', 'pseo', 'categories.json');
  const content = await readFile(dataPath, 'utf-8');
  categoriesCache = JSON.parse(content) as PseoCategory[];

  return categoriesCache;
}

/**
 * Load all pages from JSON file
 * Data is cached after first load for performance
 */
export async function loadPages(): Promise<PseoPage[]> {
  if (pagesCache) {
    return pagesCache;
  }

  const dataPath = join(process.cwd(), 'data', 'pseo', 'pages.json');
  const content = await readFile(dataPath, 'utf-8');
  pagesCache = JSON.parse(content) as PseoPage[];

  return pagesCache;
}

/**
 * Get a category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<PseoCategory | undefined> {
  const categories = await loadCategories();
  return categories.find(cat => cat.slug === slug);
}

/**
 * Get a page by category and slug
 */
export async function getPageBySlug(categorySlug: string, pageSlug: string): Promise<PseoPage | undefined> {
  const [categories, pages] = await Promise.all([loadCategories(), loadPages()]);

  const category = categories.find(cat => cat.slug === categorySlug);
  if (!category) {
    return undefined;
  }

  return pages.find(page => page.categoryId === category.id && page.slug === pageSlug);
}

/**
 * Get all pages for a category
 */
export async function getPagesByCategory(categorySlug: string): Promise<PseoPage[]> {
  const [categories, pages] = await Promise.all([loadCategories(), loadPages()]);

  const category = categories.find(cat => cat.slug === categorySlug);
  if (!category) {
    return [];
  }

  return pages.filter(page => page.categoryId === category.id);
}

/**
 * Get related pages (same category, excluding current page)
 * Returns up to 'limit' pages
 */
export async function getRelatedPages(
  categorySlug: string,
  currentPageSlug: string,
  limit: number = 3,
): Promise<PseoPage[]> {
  const categoryPages = await getPagesByCategory(categorySlug);

  return categoryPages.filter(page => page.slug !== currentPageSlug).slice(0, limit);
}

/**
 * Get all category/page combinations for static generation
 * This powers generateStaticParams in the route
 */
export async function getAllPageParams(): Promise<Array<{ category: string; slug: string }>> {
  const [categories, pages] = await Promise.all([loadCategories(), loadPages()]);

  const params: Array<{ category: string; slug: string }> = [];

  for (const page of pages) {
    const category = categories.find(cat => cat.id === page.categoryId);
    if (category) {
      params.push({
        category: category.slug,
        slug: page.slug,
      });
    }
  }

  return params;
}
