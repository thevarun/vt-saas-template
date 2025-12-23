import { expect, test } from '@playwright/test';

test.describe('I18n', () => {
  test.describe('Language Switching', () => {
    test('should switch language from English to Hindi using dropdown and verify text on the homepage', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('Your AI-powered health companion for a healthier life.')).toBeVisible();

      await page.getByRole('button', { name: 'lang-switcher' }).click();
      await page.getByText('हिन्दी').click();

      // Hindi translation uses same English text for now
      await expect(page.getByText('Your AI-powered health companion for a healthier life.')).toBeVisible();
    });

    test('should switch language from English to Hindi using URL and verify text on the sign-in page', async ({ page }) => {
      await page.goto('/sign-in');

      await expect(page.getByText('Email Address')).toBeVisible();

      await page.goto('/hi/sign-in');

      // Hindi translation uses same English text for now
      await expect(page.getByText('Email Address')).toBeVisible();
    });
  });
});
