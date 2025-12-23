/**
 * Playwright fixtures for authenticated test scenarios
 * Provides reusable authenticated context for tests
 */

import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

type AuthenticatedFixtures = {
  authenticatedPage: Page;
};

/**
 * Extended Playwright test with authenticated page fixture
 * Usage: test('my test', async ({ authenticatedPage }) => { ... })
 */
export const test = base.extend<AuthenticatedFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Get test credentials from setup.ts
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error('Test credentials not found. Ensure setup.ts ran successfully.');
    }

    // Sign in through the UI to ensure Supabase properly sets all cookies
    await page.goto('/sign-in');

    // Fill in the sign-in form
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect after successful sign-in
    // Should redirect to dashboard or home page
    await page.waitForURL(/\/(dashboard|en|fr)/, { timeout: 10000 });

    // Page is now authenticated - use it in the test
    await use(page);

    // Cleanup: Sign out after test
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
  },
});

export { expect } from '@playwright/test';
