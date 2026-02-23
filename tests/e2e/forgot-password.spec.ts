import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Forgot Password Flow
 * Tests form rendering, submission, and success state
 * Security: Always shows success regardless of email existence
 */

test.describe('Forgot Password', () => {
  test('[P1] should display forgot password form with email field', async ({ page }) => {
    // GIVEN: User navigates to forgot-password page
    await page.goto('/forgot-password');

    // THEN: Form elements are visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('[P1] should show success message after email submission', async ({ page }) => {
    // GIVEN: User is on forgot-password page
    // Mock Supabase auth to prevent actual email sending
    await page.route('**/auth/v1/recover', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    // WHEN: User submits a valid email
    await page.locator('#email').fill('user@example.com');
    await page.locator('button[type="submit"]').click();

    // THEN: Success state is shown with submitted email
    await expect(page.getByText('user@example.com')).toBeVisible({ timeout: 5000 });
  });

  test('[P1] should have link back to sign-in page', async ({ page }) => {
    // GIVEN: User is on forgot-password page
    await page.goto('/forgot-password');

    // THEN: Back to sign-in link is visible
    const signInLink = page.locator('a[href*="/sign-in"]').first();

    await expect(signInLink).toBeVisible();

    // WHEN: User clicks the link
    await signInLink.click();

    // THEN: User is redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('[P1] should show validation error for empty email', async ({ page }) => {
    // GIVEN: User is on forgot-password page
    await page.goto('/forgot-password');

    // WHEN: User clicks email field and tabs away without entering email
    await page.locator('#email').click();
    await page.locator('button[type="submit"]').click();

    // THEN: Validation error is displayed
    await expect(page.locator('.text-red-600')).toBeVisible();
  });

  test('[P2] should allow trying another email from success state', async ({ page }) => {
    // GIVEN: User is on forgot-password page
    // Mock Supabase auth
    await page.route('**/auth/v1/recover', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({}),
      });
    });

    await page.goto('/forgot-password');

    // WHEN: User submits email and reaches success state
    await page.locator('#email').fill('first@example.com');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('first@example.com')).toBeVisible({ timeout: 5000 });

    // AND: User clicks "try another email"
    await page.getByRole('button', { name: /try another/i }).click();

    // THEN: Form is shown again (email field visible)
    await expect(page.locator('#email')).toBeVisible();
  });
});
