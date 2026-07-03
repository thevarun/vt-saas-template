import { DashboardPage } from './helpers/DashboardPage';
import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for Dashboard - Simplified for solo dev workflow
 * Tests the cross-boundary concern: authenticated protected-route access.
 */

test.describe('Dashboard', () => {
  test('authenticated users can access dashboard', async ({
    authenticatedPage,
  }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);

    await dashboardPage.goto();

    // Protected-route access is the cross-boundary concern: an authed session
    // loads the dashboard without redirecting. Greeting-text content is asserted
    // in the co-located Vitest test, not here.
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);
  });
});
