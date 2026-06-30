import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Accessibility - SEO and A11y Quick Fixes (T-006)', () => {
  test('landing page has exactly one h1', async ({ page }) => {
    await page.goto('/en');

    const h1Count = page.locator('h1');

    await expect(h1Count).toHaveCount(1);
  });

  test('landing page renders canonical tag', async ({ page }) => {
    await page.goto('/en');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

    expect(canonical).not.toBeNull();
    expect(canonical).toMatch(/^https?:\/\//);
  });

  test('landing page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/en');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('sign-in page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/en/sign-in');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('app shell renders skip-to-main-content link', async ({ page }) => {
    await page.goto('/en');

    const skipLink = page.locator('a[href="#main-content"]');

    await expect(skipLink).toHaveCount(1);

    const mainContent = page.locator('#main-content');

    await expect(mainContent).toHaveCount(1);
  });
});
