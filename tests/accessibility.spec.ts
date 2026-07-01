import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility + canonical metadata — cross-boundary only.
 *
 * Structural assertions (exactly one h1, skip-to-content link present) were
 * dropped: they're component/layout structure better asserted in Vitest, and
 * the axe scans below catch real WCAG regressions across the rendered page.
 * The canonical-tag check stays because SEO metadata injection crosses the
 * server-render boundary.
 */

test.describe('Accessibility & SEO metadata', () => {
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
});
