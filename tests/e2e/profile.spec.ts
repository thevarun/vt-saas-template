import { expect, test } from './helpers/fixtures';

/**
 * E2E for User Profile — cross-boundary only.
 *
 * Field states (read-only email, editable fields), the save button and the
 * delete-account confirmation dialog are covered by the co-located Vitest test
 * (dashboard/user-profile/page.test.tsx). E2E keeps a single check that the
 * protected page loads for an authenticated user with their data rendered.
 */

test.describe('User Profile', () => {
  test('authenticated user can load profile with their data', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard/user-profile');

    await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(authenticatedPage.locator('#email')).toBeVisible();
    await expect(authenticatedPage.locator('#username')).toBeVisible();
    await expect(authenticatedPage.locator('#displayName')).toBeVisible();
  });
});
