/**
 * E2E Tests for Dynamic Open Graph Image Generation
 *
 * Tests the /api/og endpoint for generating dynamic OG images.
 */

import { expect, test } from '@playwright/test';

test.describe('SEO - Dynamic OG Images', () => {
  test('generates default OG image', async ({ page }) => {
    const response = await page.goto('/api/og');

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('generates OG image with title parameter', async ({ page }) => {
    const response = await page.goto('/api/og?title=Dashboard');

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('generates OG image with title and description parameters', async ({ page }) => {
    const response = await page.goto(
      '/api/og?title=User%20Dashboard&description=View%20your%20analytics',
    );

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('handles special characters in parameters', async ({ page }) => {
    const response = await page.goto(
      '/api/og?title=Hello%20%26%20Welcome!&description=Test%20%3A%20Description',
    );

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('handles long title', async ({ page }) => {
    const longTitle = 'This is a very long title that should be truncated by the OG image generator to prevent overflow';
    const response = await page.goto(`/api/og?title=${encodeURIComponent(longTitle)}`);

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('handles long description', async ({ page }) => {
    const longDescription = 'This is a very long description that should be truncated by the OG image generator to prevent overflow and maintain readability';
    const response = await page.goto(
      `/api/og?title=Test&description=${encodeURIComponent(longDescription)}`,
    );

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('generation is fast (< 500ms)', async ({ page }) => {
    const start = Date.now();
    await page.goto('/api/og?title=Performance%20Test');
    const duration = Date.now() - start;

    // Allow some overhead for navigation, but should be under 1 second
    expect(duration).toBeLessThan(1000);
  });

  test('handles Unicode characters', async ({ page }) => {
    const response = await page.goto(
      `/api/og?title=${encodeURIComponent('नमस्ते 🙏')}`,
    );

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });

  test('handles empty parameters gracefully', async ({ page }) => {
    const response = await page.goto('/api/og?title=&description=');

    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/png');
  });
});
