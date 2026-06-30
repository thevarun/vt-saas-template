/**
 * Tests for pSEO data loading utilities.
 *
 * The loader resolves content from `process.env.PSEO_CONTENT_ROOT` when set,
 * otherwise from `<cwd>/content/blog`. Tests point at fixture directories
 * via this env override and re-import the module to reset its in-memory cache.
 *
 * Caching is gated on `NODE_ENV === 'production'`: in prod, repeat calls return
 * the same array reference; outside prod the cache is bypassed so content edits
 * surface without a dev-server restart. Both dimensions are asserted below by
 * stubbing NODE_ENV with vi.stubEnv.
 */

import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURES = join(__dirname, '__fixtures__');

async function loadDataModule(root: string) {
  process.env.PSEO_CONTENT_ROOT = root;
  vi.resetModules();
  return import('../data');
}

describe('pSEO Data Utilities — happy path', () => {
  let mod: typeof import('../data');

  beforeEach(async () => {
    mod = await loadDataModule(join(FIXTURES, 'blog'));
  });

  afterEach(() => {
    delete process.env.PSEO_CONTENT_ROOT;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('loadCategories', () => {
    it('loads categories from directory names', async () => {
      const categories = await mod.loadCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.map(c => c.slug).sort()).toEqual(['health', 'productivity']);
    });

    it('uses _category.md frontmatter when present', async () => {
      const categories = await mod.loadCategories();
      const productivity = categories.find(c => c.slug === 'productivity');

      expect(productivity?.name).toBe('Productivity');
      expect(productivity?.description).toBe('Tools and techniques to boost your productivity.');
    });

    it('falls back to title-cased slug when no _category.md', async () => {
      const categories = await mod.loadCategories();
      const health = categories.find(c => c.slug === 'health');

      expect(health?.name).toBe('Health');
      expect(health?.description).toBe('');
    });
  });

  describe('loadPages', () => {
    it('loads all MDX pages', async () => {
      const pages = await mod.loadPages();

      expect(pages.length).toBe(3);
    });

    it('returns pages with required fields and frontmatter values', async () => {
      const pages = await mod.loadPages();
      const page = pages.find(p => p.slug === 'time-management-techniques');

      expect(page).toMatchObject({
        id: 'time-management-techniques',
        categoryId: 'productivity',
        slug: 'time-management-techniques',
        title: '10 Proven Time Management Techniques',
        description: 'Master your time with these effective techniques.',
        keywords: ['time management', 'productivity'],
        lastModified: '2024-02-01',
      });
      expect(page?.content).toContain('Body content for the fixture article');
    });

    it('skips files prefixed with underscore', async () => {
      const pages = await mod.loadPages();

      expect(pages.find(p => p.slug.startsWith('_'))).toBeUndefined();
    });
  });

  describe('getCategoryBySlug', () => {
    it('finds a category by slug', async () => {
      const category = await mod.getCategoryBySlug('productivity');

      expect(category?.slug).toBe('productivity');
    });

    it('returns undefined for non-existent category', async () => {
      const category = await mod.getCategoryBySlug('does-not-exist');

      expect(category).toBeUndefined();
    });
  });

  describe('getPageBySlug', () => {
    it('finds a page by category and slug', async () => {
      const page = await mod.getPageBySlug('productivity', 'time-management-techniques');

      expect(page?.slug).toBe('time-management-techniques');
    });

    it('returns undefined for non-existent page', async () => {
      const page = await mod.getPageBySlug('productivity', 'does-not-exist');

      expect(page).toBeUndefined();
    });

    it('returns undefined when slug exists but wrong category', async () => {
      const page = await mod.getPageBySlug('health', 'time-management-techniques');

      expect(page).toBeUndefined();
    });
  });

  describe('getPagesByCategory', () => {
    it('returns all pages for a category', async () => {
      const pages = await mod.getPagesByCategory('productivity');

      expect(pages.length).toBe(2);
      expect(pages.every(p => p.categoryId === 'productivity')).toBe(true);
    });

    it('returns empty array for non-existent category', async () => {
      const pages = await mod.getPagesByCategory('does-not-exist');

      expect(pages).toEqual([]);
    });
  });

  describe('getRelatedPages', () => {
    it('returns sibling pages excluding the current one', async () => {
      const related = await mod.getRelatedPages('productivity', 'time-management-techniques', 3);

      expect(related.every(p => p.slug !== 'time-management-techniques')).toBe(true);
      expect(related.length).toBe(1);
    });

    it('respects the limit parameter', async () => {
      const related = await mod.getRelatedPages('productivity', 'time-management-techniques', 0);

      expect(related.length).toBe(0);
    });

    it('returns empty array when category has no other pages', async () => {
      const related = await mod.getRelatedPages('health', 'stress-management', 3);

      expect(related).toEqual([]);
    });
  });

  describe('getAllPageParams', () => {
    it('returns one entry per MDX file', async () => {
      const params = await mod.getAllPageParams();

      expect(params.length).toBe(3);
    });

    it('each entry has category and slug strings', async () => {
      const params = await mod.getAllPageParams();

      for (const param of params) {
        expect(typeof param.category).toBe('string');
        expect(typeof param.slug).toBe('string');
      }
    });

    it('matches every param to a real page', async () => {
      const params = await mod.getAllPageParams();
      const categories = await mod.loadCategories();
      const pages = await mod.loadPages();

      for (const param of params) {
        const category = categories.find(c => c.slug === param.category);

        expect(category).toBeDefined();

        const page = pages.find(p => p.slug === param.slug && p.categoryId === category?.id);

        expect(page).toBeDefined();
      }
    });
  });
});

describe('pSEO Data Utilities — cache gate (NODE_ENV)', () => {
  afterEach(() => {
    delete process.env.PSEO_CONTENT_ROOT;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('caches categories in production (same reference on repeat calls)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const mod = await loadDataModule(join(FIXTURES, 'blog'));

    const first = await mod.loadCategories();
    const second = await mod.loadCategories();

    // Second call is served from cache: identical reference, not re-read.
    expect(first).toBe(second);
  });

  it('bypasses the categories cache outside production (fresh data each call)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const mod = await loadDataModule(join(FIXTURES, 'blog'));

    const first = await mod.loadCategories();
    const second = await mod.loadCategories();

    expect(first).toEqual(second); // Equal content...
    expect(first).not.toBe(second); // ...but freshly read each time (no cache)
  });

  it('caches pages in production (same reference on repeat calls)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const mod = await loadDataModule(join(FIXTURES, 'blog'));

    const first = await mod.loadPages();
    const second = await mod.loadPages();

    expect(first).toBe(second);
  });

  it('bypasses the pages cache outside production (fresh data each call)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const mod = await loadDataModule(join(FIXTURES, 'blog'));

    const first = await mod.loadPages();
    const second = await mod.loadPages();

    expect(first).toEqual(second); // Equal content...
    expect(first).not.toBe(second); // ...but freshly read each time (no cache)
  });
});

describe('pSEO Data Utilities — invalid frontmatter', () => {
  afterEach(() => {
    delete process.env.PSEO_CONTENT_ROOT;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws with the offending file path when frontmatter is missing required fields', async () => {
    const mod = await loadDataModule(join(FIXTURES, 'blog-bad'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(mod.loadPages()).rejects.toThrow(/missing-title\.mdx/);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid frontmatter in:'),
    );

    errorSpy.mockRestore();
  });
});
