/**
 * pSEO Data Loading Utilities
 *
 * Blog posts live as MDX files on disk under `content/blog/{category-slug}/{post-slug}.mdx`.
 * Frontmatter is parsed with gray-matter; the body is returned raw for next-mdx-remote/rsc to render.
 *
 * Authoring rules:
 * - One folder per category. Optional `_category.md` inside a folder provides display metadata.
 * - Article filenames become slugs. Files prefixed with `_` are skipped.
 * - Frontmatter must include: title, description, lastModified. keywords is optional.
 *
 * next-mdx-remote does NOT support `import`/`export` inside MDX. Custom JSX components
 * must be passed via the `components` prop on <MDXRemote> — see src/components/pseo/mdx-components.tsx.
 *
 * The content root can be overridden with `PSEO_CONTENT_ROOT` (used by tests to point
 * at fixture directories); it defaults to `<cwd>/content/blog`.
 */

import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import fastGlob from 'fast-glob';
import matter from 'gray-matter';
import { z } from 'zod';

const CONTENT_ROOT = process.env.PSEO_CONTENT_ROOT ?? join(process.cwd(), 'content', 'blog');

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
  content: string; // Raw MDX body
  keywords: string[];
  lastModified: string;
};

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  lastModified: z.string().min(1),
  keywords: z.array(z.string()).optional().default([]),
});

const categoryFrontmatterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().default(''),
});

// Cache for loaded data (populated on first load in production).
// Disabled outside production so file changes under content/blog/ surface
// without restart.
let categoriesCache: PseoCategory[] | null = null;
let pagesCache: PseoPage[] | null = null;

/**
 * Whether loaded data should be cached in module-level state.
 *
 * Evaluated per call (not as a module-load const) so the prod-gate stays
 * trivially testable and the behavior is unchanged: cache in production,
 * bypass everywhere else so dev edits to content/blog/ surface on the next
 * request without a dev-server restart.
 */
function shouldCache(): boolean {
  return process.env.NODE_ENV === 'production';
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function tryReadCategoryMeta(categorySlug: string): Promise<{ name?: string; description: string }> {
  const metaPath = join(CONTENT_ROOT, categorySlug, '_category.md');
  try {
    const raw = await readFile(metaPath, 'utf-8');
    const parsed = matter(raw);
    const validated = categoryFrontmatterSchema.parse(parsed.data);
    return { name: validated.name, description: validated.description };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { description: '' };
    }
    console.error(`Invalid frontmatter in: ${relative(process.cwd(), metaPath)}`);
    throw err;
  }
}

/**
 * Load categories from disk (one folder per category under content/blog/).
 * Data is cached after first load in production; in dev, the cache is
 * bypassed so newly added folders / edited `_category.md` files reflect on
 * the next request without a dev-server restart.
 */
export async function loadCategories(): Promise<PseoCategory[]> {
  if (shouldCache() && categoriesCache) {
    return categoriesCache;
  }

  const categoryDirs = await fastGlob('*', {
    cwd: CONTENT_ROOT,
    onlyDirectories: true,
    suppressErrors: true,
  });

  const categories = await Promise.all(
    categoryDirs.sort().map(async (slug) => {
      const meta = await tryReadCategoryMeta(slug);
      return {
        id: slug,
        slug,
        name: meta.name ?? titleCase(slug),
        description: meta.description,
      } satisfies PseoCategory;
    }),
  );

  if (shouldCache()) {
    categoriesCache = categories;
  }

  return categories;
}

/**
 * Load all MDX pages from disk (content/blog/{category}/{slug}.mdx).
 * Files prefixed with `_` are skipped. Data is cached after first load in
 * production; in dev, the cache is bypassed so edits to MDX files reflect on
 * the next request without a dev-server restart.
 */
export async function loadPages(): Promise<PseoPage[]> {
  if (shouldCache() && pagesCache) {
    return pagesCache;
  }

  const files = await fastGlob('*/[!_]*.mdx', {
    cwd: CONTENT_ROOT,
    onlyFiles: true,
    suppressErrors: true,
  });

  const pages = await Promise.all(
    files.sort().map(async (relPath) => {
      const absPath = join(CONTENT_ROOT, relPath);
      const raw = await readFile(absPath, 'utf-8');
      const parsed = matter(raw);

      const result = frontmatterSchema.safeParse(parsed.data);
      if (!result.success) {
        const display = relative(process.cwd(), absPath);
        console.error(`Invalid frontmatter in: ${display}`);
        console.error(result.error.format());
        throw new Error(`Invalid frontmatter in ${display}`);
      }

      const [categoryId, fileName] = relPath.split('/');
      const slug = fileName!.replace(/\.mdx$/, '');

      return {
        id: slug,
        categoryId: categoryId!,
        slug,
        title: result.data.title,
        description: result.data.description,
        content: parsed.content,
        keywords: result.data.keywords,
        lastModified: result.data.lastModified,
      } satisfies PseoPage;
    }),
  );

  if (shouldCache()) {
    pagesCache = pages;
  }

  return pages;
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
 * Get all category slugs for static generation of category pages
 */
export async function getAllCategoryParams(): Promise<Array<{ category: string }>> {
  const categories = await loadCategories();
  return categories.map(cat => ({ category: cat.slug }));
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
