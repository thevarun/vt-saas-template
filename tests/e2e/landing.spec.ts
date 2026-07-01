import { test } from '@playwright/test';

import { expect, test as authenticatedTest } from './helpers/fixtures';

/**
 * E2E Tests for Landing Page (Story 2.3)
 * Tests landing page auth state detection (AC #11-12)
 */

test.describe('Landing Page', () => {
  test.describe('Logged-out State (AC #11)', () => {
    test('displays Log in and Get started CTAs when not authenticated', async ({
      page,
    }) => {
      await page.goto('/');

      // The marketing navbar's auth CTAs open the overlay dialog (no /sign-in nav).
      await expect(
        page.getByRole('button', { name: 'Log in' }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Get started' }).first(),
      ).toBeVisible();

      // Dashboard button should NOT be visible
      const dashboardButton = page.locator(
        'a[href*="/dashboard"], button:has-text("Dashboard")',
      );

      await expect(dashboardButton).toBeHidden();
    });

    test('Log in CTA opens the auth dialog (sign-in)', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: 'Log in' }).first().click();

      // Overlay dialog opens in place — URL stays on the landing, no /sign-in nav.
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('Get started CTA opens the auth dialog (sign-up)', async ({
      page,
    }) => {
      await page.goto('/');

      await page.getByRole('button', { name: 'Get started' }).first().click();

      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Logged-in State (AC #12)', () => {
    authenticatedTest(
      'displays dashboard button when authenticated',
      async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Dashboard button should be visible (in the navbar's right menu section)
        const dashboardButton = authenticatedPage
          .locator('a[href="/dashboard"]:has-text("Dashboard")')
          .first();

        await expect(dashboardButton).toBeVisible();

        // Hero section should also show "Go to Dashboard" button
        const heroDashboardButton = authenticatedPage.locator(
          'a[href="/dashboard"]:has-text("Go to Dashboard")',
        );

        await expect(heroDashboardButton).toBeVisible();

        // Auth-specific sign-in/sign-up buttons should NOT be visible
        // Note: We check that there are no visible "Sign In" or "Sign Up" text links that point to auth pages
        // (excluding the many placeholder menu links that also point to /sign-up)
        const authSignInLink = authenticatedPage.locator(
          'a[href="/sign-in"]:has-text("Sign In")',
        );
        const authSignUpButton = authenticatedPage
          .locator('a[href="/sign-up"]')
          .filter({ hasText: /^Sign Up$/ });

        await expect(authSignInLink).toBeHidden();

        await expect(authSignUpButton).toBeHidden();
      },
    );

    authenticatedTest(
      'dashboard button navigates to dashboard',
      async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        const dashboardButton = authenticatedPage
          .locator('a[href*="/dashboard"], button:has-text("Dashboard")')
          .first();
        await dashboardButton.click();

        await expect(authenticatedPage).toHaveURL(/\/dashboard/);
      },
    );
  });
});
