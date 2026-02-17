import { expect, test } from '@playwright/test';

test.describe('SEO - Hreflang Tags', () => {
  test('landing page has hreflang tags for all locales', async ({ page }) => {
    await page.goto('/en');

    // Get all hreflang link tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    // Should have 4 links (en, hi, bn, x-default)
    expect(hreflangLinks.length).toBe(4);

    // Extract hreflang values
    const hreflangValues = await Promise.all(
      hreflangLinks.map(link => link.getAttribute('hreflang')),
    );

    expect(hreflangValues).toContain('en');
    expect(hreflangValues).toContain('hi');
    expect(hreflangValues).toContain('bn');
    expect(hreflangValues).toContain('x-default');
  });

  test('x-default points to unprefixed default locale URL', async ({ page }) => {
    await page.goto('/en');

    // Find the x-default link
    const xDefaultLink = page.locator('link[rel="alternate"][hreflang="x-default"]');
    const href = await xDefaultLink.getAttribute('href');

    // x-default should be the unprefixed canonical URL (no /en prefix)
    expect(href).toMatch(/^https?:\/\/[^/]+\/?$/);
  });

  test('hreflang URLs are absolute', async ({ page }) => {
    await page.goto('/en');

    // Get all hreflang link tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    // All hrefs should be absolute URLs
    for (const link of hreflangLinks) {
      const href = await link.getAttribute('href');

      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test('hreflang includes self-referential link for default locale (unprefixed)', async ({ page }) => {
    await page.goto('/en');

    // Find the en hreflang link
    const enLink = page.locator('link[rel="alternate"][hreflang="en"]');
    const href = await enLink.getAttribute('href');

    // Default locale (en) should be unprefixed per localePrefix: 'as-needed'
    expect(href).toMatch(/^https?:\/\/[^/]+\/?$/);
  });

  test('Hindi page has correct hreflang tags', async ({ page }) => {
    await page.goto('/hi');

    // Get all hreflang link tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    // Should have 4 links (en, hi, bn, x-default)
    expect(hreflangLinks.length).toBe(4);

    // Find the hi hreflang link (self-referential)
    const hiLink = page.locator('link[rel="alternate"][hreflang="hi"]');
    const href = await hiLink.getAttribute('href');

    // Should point to /hi
    expect(href).toContain('/hi');
  });

  test('protected pages do not have hreflang tags', async ({ page }) => {
    // Sign in first
    await page.goto('/en/sign-in');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete (could be /dashboard or /en/dashboard)
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Should NOT have hreflang tags
    const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

    expect(hreflangLinks.length).toBe(0);

    // Should have noindex meta tag
    const robotsMeta = page.locator('meta[name="robots"]').first();
    const content = await robotsMeta.getAttribute('content');

    expect(content).toContain('noindex');
  });

  // Note: Admin pages also have the same noindex + no hreflang behavior
  // as protected pages, since they use a similar layout with robots: noindex
  // and alternates: { languages: {} }. Testing with dashboard is sufficient.
});
