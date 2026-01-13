import { DashboardPage } from './helpers/DashboardPage';
import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for Dashboard - Simplified for solo dev workflow
 * Tests core functionality: access and navigation to chat
 */

test.describe('Dashboard', () => {
  test('authenticated users can access dashboard', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);

    await dashboardPage.goto();

    // Should load dashboard successfully (not redirect)
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);

    // Verify dashboard content is visible
    const greeting = await dashboardPage.getPersonalizedGreeting();

    await expect(greeting).toBeVisible();
  });

  test('can navigate from dashboard to chat', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);

    await dashboardPage.goto();

    // Navigate to chat via dashboard link
    await dashboardPage.navigateToChat();

    // Should be on chat page
    await expect(authenticatedPage).toHaveURL(/\/chat/);
  });
});
