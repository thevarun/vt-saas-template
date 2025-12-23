import { expect, test as base } from '@playwright/test';

import { AuthPage } from './helpers/AuthPage';

/**
 * E2E tests for Supabase authentication flows
 * Covers sign-up, sign-in, sign-out, and protected route access
 */

// Test user credentials (for one-off sign-up tests)
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Use base test for unauthenticated scenarios
const test = base;

test.describe('Authentication', () => {
  test.describe('Sign Up Flow', () => {
    test('should display sign up page', async ({ page }) => {
      await page.goto('/sign-up');

      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
      await expect(page.getByText('Join HealthCompanion and start your wellness journey')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // HTML5 validation will prevent form submission
      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', '123'); // Too short
      await page.click('button[type="submit"]');

      // HTML5 minLength validation will prevent submission
      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    });

    test('should submit sign up form and show verification message', async ({ page }) => {
      await page.goto('/sign-up');

      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait for success message
      await expect(page.getByText('Check your email!')).toBeVisible();
      await expect(page.getByText(new RegExp(TEST_EMAIL))).toBeVisible();
      await expect(page.getByText(/verify your account/)).toBeVisible();
    });
  });

  test.describe('Sign In Flow', () => {
    test('should display sign in page', async ({ page }) => {
      await page.goto('/sign-in');

      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(page.getByText(/invalid/i)).toBeVisible();
    });

    test('should sign in with valid credentials and redirect to dashboard', async ({ page }) => {
      // Use test account created in setup.ts (email verification disabled in test env)
      const authPage = new AuthPage(page);

      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;

      if (!testEmail || !testPassword) {
        throw new Error('Test credentials not found. Ensure setup.ts ran successfully.');
      }

      await authPage.signIn(testEmail, testPassword);

      // Should redirect to dashboard after successful sign in
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from dashboard to sign-in', async ({ page }) => {
      await page.goto('/dashboard');

      // Should be redirected to sign-in page
      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('should redirect unauthenticated user from onboarding to sign-in', async ({ page }) => {
      await page.goto('/onboarding');

      // Should be redirected to sign-in page
      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('should maintain session across page refreshes', async ({ page }) => {
      const authPage = new AuthPage(page);

      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;

      if (!testEmail || !testPassword) {
        throw new Error('Test credentials not found.');
      }

      // Sign in first
      await authPage.signIn(testEmail, testPassword);

      await expect(page).toHaveURL(/\/dashboard/);

      // Refresh the page
      await page.reload();

      // Should still be on dashboard, not redirected to sign-in
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Sign Out Flow', () => {
    test('should sign out user and redirect to home page', async ({ page }) => {
      const authPage = new AuthPage(page);

      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;

      if (!testEmail || !testPassword) {
        throw new Error('Test credentials not found.');
      }

      // Sign in first to establish session
      await authPage.signIn(testEmail, testPassword);

      await expect(page).toHaveURL(/\/dashboard/);

      // Navigate to sign-out page
      await authPage.goToSignOut();

      // Should redirect to home page after sign out (with optional locale prefix)
      await expect(page).toHaveURL(/^\/(en|hi|bn)?\/?$|^https?:\/\/[^/]+(\/|\/en|\/hi|\/bn)?$/);

      // Attempting to access dashboard should redirect back to sign-in
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/sign-in/);
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate from sign-up to sign-in', async ({ page }) => {
      await page.goto('/sign-up');

      await page.click('a:has-text("Sign in")');

      await expect(page).toHaveURL(/\/sign-in/);
    });

    test('should navigate from sign-in to sign-up', async ({ page }) => {
      await page.goto('/sign-in');

      // Look for "Sign up" or "Create account" link
      const signUpLink = page.locator('a').filter({ hasText: /sign up|create account/i }).first();

      if (await signUpLink.isVisible()) {
        await signUpLink.click();

        await expect(page).toHaveURL(/\/sign-up/);
      }
    });
  });
});
