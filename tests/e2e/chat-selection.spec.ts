import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for Chat Selection Page
 * Tests that both chat options are displayed and navigable
 */

test.describe('Chat Selection Page', () => {
  test('[P1] should display chat selection page with heading', async ({ authenticatedPage }) => {
    // GIVEN: Authenticated user navigates to chat selection
    await authenticatedPage.goto('/chat');

    // THEN: Page heading is visible
    await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('[P1] should display both chat option cards', async ({ authenticatedPage }) => {
    // GIVEN: Authenticated user is on chat selection page
    await authenticatedPage.goto('/chat');

    // WHEN: Page loads with heading visible
    await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible();

    // THEN: Two chat option cards are rendered (Dify and Vercel)
    const cards = authenticatedPage.locator('[class*="Card"], [class*="card"]').filter({ has: authenticatedPage.locator('a[href*="/chat/"]') });

    await expect(cards).toHaveCount(2);
  });

  test('[P1] should navigate to Dify chat when selected', async ({ authenticatedPage }) => {
    // GIVEN: Authenticated user is on chat selection page
    await authenticatedPage.goto('/chat');

    // WHEN: User clicks Dify chat "Get Started" CTA
    await authenticatedPage.getByRole('link', { name: 'Get Started' }).first().click();

    // THEN: User is navigated to Dify chat
    await expect(authenticatedPage).toHaveURL(/\/chat\/dify/);
  });

  test('[P1] should navigate to Vercel AI chat when selected', async ({ authenticatedPage }) => {
    // GIVEN: Authenticated user is on chat selection page
    await authenticatedPage.goto('/chat');

    // WHEN: User clicks Vercel AI chat "Get Started" CTA
    await authenticatedPage.getByRole('link', { name: 'Get Started' }).last().click();

    // THEN: User is navigated to Vercel chat
    await expect(authenticatedPage).toHaveURL(/\/chat\/vercel/);
  });
});
