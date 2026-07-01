import { expect, test } from '@playwright/test';

/**
 * E2E for Sign-Up — cross-boundary only.
 *
 * Field rendering, email/password validation, OAuth buttons, submit-button
 * enable/disable and password requirements are covered by the co-located Vitest
 * tests (sign-up/page.test.tsx and components/auth/social-auth-buttons.test.tsx).
 * E2E keeps a single check that the page renders server-side and routes to
 * sign-in. Account creation is intentionally not E2E'd (avoids test-data pollution).
 */

test.describe('Sign-Up Page', () => {
  test('renders and links to sign-in', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page.locator('#email')).toBeVisible();

    const signInLink = page.locator('a[href*="/sign-in"]').last();
    await signInLink.click();

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
