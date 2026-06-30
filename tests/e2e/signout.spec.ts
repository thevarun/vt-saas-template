import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for Sign-Out Flow
 * Tests that authenticated users can sign out and session is cleared
 */

test.describe('Sign-Out', () => {
  test('[P0] should sign out authenticated user and redirect to home', async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated and on dashboard
    await authenticatedPage.goto('/dashboard');

    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // WHEN: User navigates to sign-out
    await authenticatedPage.goto('/sign-out');

    // THEN: User is redirected to home page
    await authenticatedPage.waitForURL('/', { timeout: 10000 });

    await expect(authenticatedPage).toHaveURL(/\/$/);
  });

  test('[P0] should prevent access to protected routes after sign-out', async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated
    await authenticatedPage.goto('/dashboard');

    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // WHEN: User signs out
    await authenticatedPage.goto('/sign-out');
    await authenticatedPage.waitForURL('/', { timeout: 10000 });

    // AND: User tries to access protected route
    await authenticatedPage.goto('/dashboard');

    // THEN: User is redirected to sign-in
    await expect(authenticatedPage).toHaveURL(/\/sign-in/);
  });

  test('[P1] should show signing out loading state', async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated
    await authenticatedPage.goto('/dashboard');

    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // WHEN: User navigates to sign-out page
    await authenticatedPage.goto('/sign-out');

    // THEN: "Signing out..." heading appears briefly before redirect
    await expect(authenticatedPage.getByRole('heading', { name: /signing out/i })).toBeVisible();
  });
});
