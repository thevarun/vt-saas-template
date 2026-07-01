import { expect, test } from './helpers/fixtures';

/**
 * E2E for Landing Page — cross-boundary only.
 *
 * The logged-out auth CTAs — that they render as dialog-opening buttons and that
 * clicking them opens the overlay dialog — are covered by Vitest:
 * components/marketing/navbar.test.tsx ("opens the sign-in/sign-up dialog when
 * clicked") and components/marketing/auth-dialog.test.tsx (tabs + the
 * ?auth=signin AutoOpener). E2E keeps the one genuinely cross-boundary case: a
 * real authenticated session changing what the landing renders.
 */

test.describe('Landing Page', () => {
  test('authenticated session renders dashboard CTAs and hides auth buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Navbar dashboard link and hero "Go to Dashboard" CTA are visible.
    await expect(authenticatedPage.locator('a[href="/dashboard"]:has-text("Dashboard")').first()).toBeVisible();
    await expect(authenticatedPage.locator('a[href="/dashboard"]:has-text("Go to Dashboard")')).toBeVisible();

    // The logged-out auth CTAs (dialog triggers) are not shown to an authed user.
    await expect(authenticatedPage.getByRole('button', { name: 'Log in' })).toBeHidden();
  });
});
