import { expect, test } from '@playwright/test';

test.describe('SEO - Robots and Sitemap', () => {
  test.describe('robots.txt', () => {
    test('has correct content type', async ({ page }) => {
      const response = await page.goto('/robots.txt');

      // Should be text/plain
      expect(response?.headers()['content-type']).toContain('text/plain');
    });

    test('has correct rules and format', async ({ page }) => {
      await page.goto('/robots.txt');

      // Verify rules (User-Agent is capitalized by Next.js)
      await expect(page.locator('body')).toContainText('User-Agent: *');
      await expect(page.locator('body')).toContainText('Allow: /');
      await expect(page.locator('body')).toContainText('Disallow: /dashboard');
      await expect(page.locator('body')).toContainText('Disallow: /admin');
      await expect(page.locator('body')).toContainText('Disallow: /api');
      await expect(page.locator('body')).toContainText('Disallow: /onboarding');
      await expect(page.locator('body')).toContainText('Disallow: /chat');
      await expect(page.locator('body')).toContainText('Disallow: /sign-out');
      await expect(page.locator('body')).toContainText('Disallow: /design-system');
    });

    test('references sitemap with absolute URL', async ({ page }) => {
      await page.goto('/robots.txt');

      // Sitemap URL should be absolute (starts with http:// or https://)
      await expect(page.locator('body')).toContainText(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
    });
  });

  test.describe('sitemap.xml', () => {
    test('has correct content type', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');

      // Should be XML
      expect(response?.headers()['content-type']).toMatch(/xml/);
    });

    test('has valid XML structure', async ({ page }) => {
      await page.goto('/sitemap.xml');

      // Verify XML structure (browser may render XML, so check for core elements)
      await expect(page.locator('body')).toContainText('<urlset');
      await expect(page.locator('body')).toContainText('xmlns');
      await expect(page.locator('body')).toContainText('</urlset>');
      // Check for sitemap namespace
      await expect(page.locator('body')).toContainText('http://www.sitemaps.org/schemas/sitemap');
    });

    test('includes all locales', async ({ page }) => {
      await page.goto('/sitemap.xml');

      // Check for all locale URLs
      await expect(page.locator('body')).toContainText('/en');
      await expect(page.locator('body')).toContainText('/hi');
      await expect(page.locator('body')).toContainText('/bn');
    });

    test('excludes private routes', async ({ page }) => {
      await page.goto('/sitemap.xml');

      const bodyText = await page.locator('body').textContent();

      // Should NOT contain auth routes
      expect(bodyText).not.toContain('/dashboard');
      expect(bodyText).not.toContain('/admin');
      expect(bodyText).not.toContain('/onboarding');
      expect(bodyText).not.toContain('/chat');
    });

    test('uses absolute URLs', async ({ page }) => {
      await page.goto('/sitemap.xml');

      const content = page.locator('body');

      await expect(content).toHaveText();

      // All URLs should start with http:// or https://
      const locMatches = content!.match(/<loc>(.+?)<\/loc>/g);

      expect(locMatches).toBeTruthy();
      expect(locMatches!.length).toBeGreaterThan(0);

      for (const locTag of locMatches!) {
        expect(locTag).toMatch(/<loc>https?:\/\//);
      }
    });

    test('entries have lastmod element', async ({ page }) => {
      await page.goto('/sitemap.xml');

      // Should have lastmod tags
      await expect(page.locator('body')).toContainText('<lastmod>');
      await expect(page.locator('body')).toContainText('</lastmod>');
    });

    test('has expected number of entries', async ({ page }) => {
      await page.goto('/sitemap.xml');

      const content = page.locator('body');

      await expect(content).toHaveText();

      // Count <url> elements (should be: public routes × locale count)
      // Currently: 1 public route (/) × 3 locales = 3 entries
      const urlMatches = content!.match(/<url>/g);

      expect(urlMatches).toBeTruthy();
      expect(urlMatches!.length).toBe(3);
    });

    test('entries have valid changefreq and priority', async ({ page }) => {
      await page.goto('/sitemap.xml');

      // Should have changefreq and priority
      await expect(page.locator('body')).toContainText('<changefreq>');
      await expect(page.locator('body')).toContainText('<priority>');

      // Homepage should have priority 1.0
      await expect(page.locator('body')).toContainText('<priority>1</priority>');
    });
  });
});
