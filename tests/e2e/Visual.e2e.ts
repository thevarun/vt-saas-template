import percySnapshot from '@percy/playwright';
import { expect, test } from '@playwright/test';

test.describe('Visual testing', () => {
  test.describe('Static pages', () => {
    test('should take screenshot of the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('Your AI-powered health companion for a healthier life.')).toBeVisible();

      await percySnapshot(page, 'Homepage');
    });

    test('should take screenshot of the Hindi homepage', async ({ page }) => {
      await page.goto('/hi');

      // Hindi translation uses same English text for now
      await expect(page.getByText('Your AI-powered health companion for a healthier life.')).toBeVisible();

      await percySnapshot(page, 'Homepage - Hindi');
    });
  });
});
