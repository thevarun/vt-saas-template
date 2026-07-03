import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility — cross-boundary only.
 *
 * Two concerns, two layers:
 *  - Document structure that must survive the server render (canonical tag, a
 *    single h1, the skip-to-content link + its target) is asserted browserless
 *    via the `request` fixture — axe does NOT reliably flag a missing/duplicate
 *    h1 or a skip link pointing at a non-existent anchor, so these need explicit
 *    checks. They live here (not Vitest) because they're properties of the fully
 *    server-rendered app shell, not a single component.
 *  - Broad WCAG regressions are caught by the axe-core scans (real browser).
 */

test.describe('Accessibility', () => {
  test('landing page server-renders canonical, a single h1, and a skip-to-content link', async ({ request }) => {
    const html = await (await request.get('/en')).text();

    // Canonical tag present and absolute (SEO metadata survives the render).
    const canonical = html.match(/<link [^>]*rel="canonical"[^>]*>/i)?.[0];

    expect(canonical).toBeTruthy();
    expect(canonical).toMatch(/href="https?:\/\//);

    // Exactly one h1 (SEO + a11y document outline).
    const h1Count = (html.match(/<h1[\s/>]/gi) ?? []).length;

    expect(h1Count).toBe(1);

    // Skip link and its target both exist (keyboard/screen-reader navigation).
    expect(html).toContain('href="#main-content"');
    expect(html).toMatch(/id="main-content"/);
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
