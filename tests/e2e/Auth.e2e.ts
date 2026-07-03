import { expect, test as base } from '@playwright/test';

import { AuthPage } from './helpers/AuthPage';

/**
 * E2E tests for Supabase authentication.
 * Boundary-crossing flows only: middleware redirect + a real credentialed login.
 */

const test = base;

test.describe('Authentication', () => {
  // Page-rendering assertions (heading/fields visible) live in the co-located
  // Vitest test for sign-in/page. E2E keeps only boundary-crossing flows.
  test('should redirect unauthenticated user from dashboard to the landing auth dialog', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Protected-route access now redirects to the landing with dialog-intent
    // params (?auth=signin&redirect=…), not the dedicated /sign-in page.
    await expect(page).toHaveURL(/[?&]auth=signin/);
    await expect(page).toHaveURL(/redirect=%2Fdashboard/);
  });

  test('should sign in with valid credentials and redirect to dashboard', async ({
    page,
  }) => {
    const authPage = new AuthPage(page);

    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    // Skip test if credentials not available
    // eslint-disable-next-line playwright/no-skipped-test -- conditional skip when CI creds unavailable
    test.skip(
      !testEmail || !testPassword,
      'Test credentials not found. Ensure setup.ts ran successfully.',
    );

    await authPage.signIn(testEmail!, testPassword!);

    // Should redirect to dashboard after successful sign in
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
