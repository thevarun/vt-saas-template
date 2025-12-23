import { test } from '@playwright/test';

import { expect, test as authenticatedTest } from './helpers/fixtures';

/**
 * E2E Tests for Landing Page (Story 2.3)
 * Tests landing page auth state detection (AC #11-12)
 */

test.describe('Landing Page', () => {
  test.describe('Logged-out State (AC #11)', () => {
    test('displays sign in and sign up buttons when not authenticated', async ({ page }) => {
      await page.goto('/');

      // Should show sign-in button
      const signInButton = page.locator('a[href*="/sign-in"], button:has-text("Sign In")').first();

      await expect(signInButton).toBeVisible();

      // Should show sign-up button
      const signUpButton = page.locator('a[href*="/sign-up"], button:has-text("Sign Up")').first();

      await expect(signUpButton).toBeVisible();

      // Dashboard button should NOT be visible
      const dashboardButton = page.locator('a[href*="/dashboard"], button:has-text("Dashboard")');

      await expect(dashboardButton).toBeHidden();
    });

    test('sign in button navigates to sign-in page', async ({ page }) => {
      await page.goto('/');

      const signInButton = page.locator('a[href*="/sign-in"], button:has-text("Sign In")').first();
      await signInButton.click();

      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('sign up button navigates to sign-up page', async ({ page }) => {
      await page.goto('/');

      const signUpButton = page.locator('a[href*="/sign-up"], button:has-text("Sign Up")').first();
      await signUpButton.click();

      await expect(page).toHaveURL(/\/sign-up/);
    });
  });

  test.describe('Logged-in State (AC #12)', () => {
    authenticatedTest('displays dashboard button when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/');

      // Dashboard button should be visible (in the navbar's right menu section)
      const dashboardButton = authenticatedPage.locator('a[href="/dashboard"]:has-text("Dashboard")').first();

      // eslint-disable-next-line playwright/no-standalone-expect
      await expect(dashboardButton).toBeVisible();

      // Hero section should also show "Go to Dashboard" button
      const heroDashboardButton = authenticatedPage.locator('a[href="/dashboard"]:has-text("Go to Dashboard")');

      // eslint-disable-next-line playwright/no-standalone-expect
      await expect(heroDashboardButton).toBeVisible();

      // Auth-specific sign-in/sign-up buttons should NOT be visible
      // Note: We check that there are no visible "Sign In" or "Sign Up" text links that point to auth pages
      // (excluding the many placeholder menu links that also point to /sign-up)
      const authSignInLink = authenticatedPage.locator('a[href="/sign-in"]:has-text("Sign In")');
      const authSignUpButton = authenticatedPage.locator('a[href="/sign-up"]').filter({ hasText: /^Sign Up$/ });

      // eslint-disable-next-line playwright/no-standalone-expect
      await expect(authSignInLink).toBeHidden();
      // eslint-disable-next-line playwright/no-standalone-expect
      await expect(authSignUpButton).toBeHidden();
    });

    authenticatedTest('dashboard button navigates to dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/');

      const dashboardButton = authenticatedPage.locator('a[href*="/dashboard"], button:has-text("Dashboard")').first();
      await dashboardButton.click();

      // eslint-disable-next-line playwright/no-standalone-expect
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });
  });
});
