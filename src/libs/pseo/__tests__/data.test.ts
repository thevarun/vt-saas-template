/**
 * Tests for pSEO data loading utilities
 */

import { describe, expect, it } from 'vitest';

import {
  getAllPageParams,
  getCategoryBySlug,
  getPageBySlug,
  getPagesByCategory,
  getRelatedPages,
  loadCategories,
  loadPages,
} from '../data';

describe('pSEO Data Utilities', () => {
  describe('loadCategories', () => {
    it('should load all categories', async () => {
      const categories = await loadCategories();

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return categories with required fields', async () => {
      const categories = await loadCategories();
      const category = categories[0];

      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('slug');
    });

    it('should cache categories on subsequent calls', async () => {
      const first = await loadCategories();
      const second = await loadCategories();

      expect(first).toBe(second); // Same reference = cached
    });
  });

  describe('loadPages', () => {
    it('should load all pages', async () => {
      const pages = await loadPages();

      expect(pages).toBeDefined();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
    });

    it('should return pages with required fields', async () => {
      const pages = await loadPages();
      const page = pages[0];

      expect(page).toHaveProperty('id');
      expect(page).toHaveProperty('categoryId');
      expect(page).toHaveProperty('slug');
      expect(page).toHaveProperty('title');
      expect(page).toHaveProperty('description');
      expect(page).toHaveProperty('content');
      expect(page).toHaveProperty('keywords');
      expect(page).toHaveProperty('lastModified');
    });

    it('should cache pages on subsequent calls', async () => {
      const first = await loadPages();
      const second = await loadPages();

      expect(first).toBe(second); // Same reference = cached
    });
  });

  describe('getCategoryBySlug', () => {
    it('should find a category by slug', async () => {
      const category = await getCategoryBySlug('productivity');

      expect(category).toBeDefined();
      expect(category?.slug).toBe('productivity');
    });

    it('should return undefined for non-existent category', async () => {
      const category = await getCategoryBySlug('non-existent-category');

      expect(category).toBeUndefined();
    });
  });

  describe('getPageBySlug', () => {
    it('should find a page by category and slug', async () => {
      const page = await getPageBySlug('productivity', 'time-management-techniques');

      expect(page).toBeDefined();
      expect(page?.slug).toBe('time-management-techniques');
    });

    it('should return undefined for non-existent page', async () => {
      const page = await getPageBySlug('productivity', 'non-existent-page');

      expect(page).toBeUndefined();
    });

    it('should return undefined for valid page but wrong category', async () => {
      const page = await getPageBySlug('health', 'time-management-techniques');

      expect(page).toBeUndefined();
    });
  });

  describe('getPagesByCategory', () => {
    it('should return all pages for a category', async () => {
      const pages = await getPagesByCategory('productivity');

      expect(pages).toBeDefined();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);

      // All pages should be from productivity category
      const categories = await loadCategories();
      const productivityCat = categories.find(c => c.slug === 'productivity');
      pages.forEach((page) => {
        expect(page.categoryId).toBe(productivityCat?.id);
      });
    });

    it('should return empty array for non-existent category', async () => {
      const pages = await getPagesByCategory('non-existent');

      expect(pages).toEqual([]);
    });
  });

  describe('getRelatedPages', () => {
    it('should return related pages from same category', async () => {
      const relatedPages = await getRelatedPages('productivity', 'time-management-techniques', 3);

      expect(relatedPages).toBeDefined();
      expect(Array.isArray(relatedPages)).toBe(true);
      // Should not include the current page
      expect(relatedPages.every(p => p.slug !== 'time-management-techniques')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const relatedPages = await getRelatedPages('productivity', 'time-management-techniques', 2);

      expect(relatedPages.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array if no other pages in category', async () => {
      const relatedPages = await getRelatedPages('non-existent', 'some-page', 3);

      expect(relatedPages).toEqual([]);
    });
  });

  describe('getAllPageParams', () => {
    it('should return all page params for static generation', async () => {
      const params = await getAllPageParams();

      expect(params).toBeDefined();
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBeGreaterThan(0);
    });

    it('should return params with category and slug', async () => {
      const params = await getAllPageParams();
      const param = params[0];

      expect(param).toBeDefined();
      expect(param).toHaveProperty('category');
      expect(param).toHaveProperty('slug');

      if (param) {
        expect(typeof param.category).toBe('string');
        expect(typeof param.slug).toBe('string');
      }
    });

    it('should match categories to pages correctly', async () => {
      const params = await getAllPageParams();
      const categories = await loadCategories();
      const pages = await loadPages();

      // Every param should correspond to a real page
      for (const param of params) {
        const category = categories.find(c => c.slug === param.category);

        expect(category).toBeDefined();

        const page = pages.find(p => p.slug === param.slug && p.categoryId === category?.id);

        expect(page).toBeDefined();
      }
    });
  });
});
