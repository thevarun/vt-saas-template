import { expect, test } from '@playwright/test';

/**
 * E2E Tests for Sign-Up Page
 * Tests form rendering, validation, and social auth options
 * Does NOT create actual accounts (avoid test data pollution)
 */

test.describe('Sign-Up Page', () => {
  test('[P0] should display sign-up form with email and password fields', async ({ page }) => {
    // GIVEN: User navigates to sign-up page
    await page.goto('/sign-up');

    // THEN: Form fields are visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('[P0] should display social auth options (Google, GitHub)', async ({ page }) => {
    // GIVEN: User navigates to sign-up page
    await page.goto('/sign-up');

    // THEN: OAuth buttons are visible
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });

  test('[P1] should show validation error for invalid email on blur', async ({ page }) => {
    // GIVEN: User is on sign-up page
    await page.goto('/sign-up');

    // WHEN: User enters invalid email and tabs away
    await page.locator('#email').fill('not-an-email');
    await page.locator('#password').click(); // blur email field

    // THEN: Validation error appears
    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('[P1] should show validation error for weak password on blur', async ({ page }) => {
    // GIVEN: User is on sign-up page
    await page.goto('/sign-up');

    // WHEN: User enters weak password and tabs away
    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('weak');
    await page.locator('#email').click(); // blur password field

    // THEN: Password validation error appears
    await expect(page.locator('#password-error')).toBeVisible();
  });

  test('[P1] should have link to sign-in page', async ({ page }) => {
    // GIVEN: User is on sign-up page
    await page.goto('/sign-up');

    // THEN: Sign-in link is visible and navigates correctly
    const signInLink = page.locator('a[href*="/sign-in"]').last();

    await expect(signInLink).toBeVisible();

    // WHEN: User clicks sign-in link
    await signInLink.click();

    // THEN: User is on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('[P1] should disable submit button when form is invalid', async ({ page }) => {
    // GIVEN: User is on sign-up page with empty fields
    await page.goto('/sign-up');

    // THEN: Submit button is disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('[P1] should enable submit button when form is valid', async ({ page }) => {
    // GIVEN: User is on sign-up page
    await page.goto('/sign-up');

    // WHEN: User fills valid email and strong password
    await page.locator('#email').fill('valid@example.com');
    await page.locator('#password').fill('StrongPass1');
    // Blur to trigger validation
    await page.locator('#email').click();

    // THEN: Submit button becomes enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('[P1] should display password requirements', async ({ page }) => {
    // GIVEN: User navigates to sign-up page
    await page.goto('/sign-up');

    // THEN: Password requirements list is visible
    await expect(page.locator('ul.list-disc')).toBeVisible();
  });
});
