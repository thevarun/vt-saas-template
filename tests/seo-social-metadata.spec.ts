import { expect, test } from '@playwright/test';

test.describe('SEO - Social Metadata', () => {
  test('landing page has Open Graph tags', async ({ page }) => {
    await page.goto('/');

    // Check og:title
    const ogTitle = page.locator('meta[property="og:title"]').first();

    expect(ogTitle).toBeTruthy();

    await expect(ogTitle).toHaveAttribute('content', /.+/);

    const titleContent = await ogTitle.getAttribute('content');

    expect(titleContent).toContain('VT SaaS Template');

    // Check og:description
    const ogDescription = page
      .locator('meta[property="og:description"]')
      .first();

    expect(ogDescription).toBeTruthy();

    await expect(ogDescription).toHaveAttribute('content', /.+/);

    // Check og:image
    const ogImage = page.locator('meta[property="og:image"]').first();

    expect(ogImage).toBeTruthy();

    const imageUrl = await ogImage.getAttribute('content');

    expect(imageUrl).toMatch(/^https?:\/\//); // Absolute URL
    expect(imageUrl).toContain('/og-image.png');

    // Check og:type
    const ogType = page.locator('meta[property="og:type"]').first();

    await expect(ogType).toHaveAttribute('content', 'website');

    // Check og:site_name
    const ogSiteName = page
      .locator('meta[property="og:site_name"]')
      .first();

    await expect(ogSiteName).toHaveAttribute('content', 'VT SaaS Template');

    // Check og:url
    const ogUrl = page.locator('meta[property="og:url"]').first();

    await expect(ogUrl).toHaveAttribute('content', /^https?:\/\//);
  });

  test('landing page has Twitter Card tags', async ({ page }) => {
    await page.goto('/');

    // Check twitter:card
    const twitterCard = page
      .locator('meta[name="twitter:card"]')
      .first();

    expect(twitterCard).toBeTruthy();

    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');

    // Check twitter:title
    const twitterTitle = page
      .locator('meta[name="twitter:title"]')
      .first();

    expect(twitterTitle).toBeTruthy();

    const titleContent = await twitterTitle.getAttribute('content');

    expect(titleContent).toContain('VT SaaS Template');

    // Check twitter:description
    const twitterDescription = page
      .locator('meta[name="twitter:description"]')
      .first();

    expect(twitterDescription).toBeTruthy();

    // Check twitter:image
    const twitterImage = page
      .locator('meta[name="twitter:image"]')
      .first();

    expect(twitterImage).toBeTruthy();

    const imageUrl = await twitterImage.getAttribute('content');

    expect(imageUrl).toMatch(/^https?:\/\//); // Absolute URL
    expect(imageUrl).toContain('/og-image.png');
  });

  test('OG image asset exists and is accessible', async ({ page }) => {
    // Navigate to OG image URL
    const response = await page.goto('/og-image.png');

    // Should return 200
    expect(response?.status()).toBe(200);

    // Should be an image
    const contentType = response?.headers()['content-type'];

    expect(contentType).toMatch(/^image\//);
  });

  test('metadata includes proper image dimensions', async ({ page }) => {
    await page.goto('/');

    // Check og:image:width
    const ogImageWidth = page
      .locator('meta[property="og:image:width"]')
      .first();

    await expect(ogImageWidth).toHaveAttribute('content', '1200');

    // Check og:image:height
    const ogImageHeight = page
      .locator('meta[property="og:image:height"]')
      .first();

    await expect(ogImageHeight).toHaveAttribute('content', '630');
  });

  test('all social meta tags use absolute URLs', async ({ page }) => {
    await page.goto('/');

    // Get all og:image tags
    const ogImages = await page.locator('meta[property="og:image"]').all();

    for (const img of ogImages) {
      const url = await img.getAttribute('content');

      expect(url).toMatch(/^https?:\/\//);
    }

    // Get all twitter:image tags
    const twitterImages = await page.locator('meta[name="twitter:image"]').all();

    for (const img of twitterImages) {
      const url = await img.getAttribute('content');

      expect(url).toMatch(/^https?:\/\//);
    }

    // Check og:url
    const ogUrl = page.locator('meta[property="og:url"]').first();

    await expect(ogUrl).toHaveAttribute('content', /^https?:\/\//);
  });
});
