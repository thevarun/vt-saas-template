import { expect, test } from '@playwright/test';

/**
 * E2E for Forgot Password — cross-boundary only.
 *
 * Form rendering, validation, the success state and the "try another email"
 * retry flow are covered by the co-located Vitest test
 * (src/app/[locale]/(unauth)/(center)/forgot-password/page.test.tsx). E2E keeps
 * a single check that the page renders server-side and its cross-page routing
 * back to sign-in works.
 */

test.describe('Forgot Password', () => {
  test('renders and links back to sign-in', async ({ page }) => {
    await page.goto('/forgot-password');

    const signInLink = page.locator('a[href*="/sign-in"]').first();

    await expect(signInLink).toBeVisible();

    await signInLink.click();

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
