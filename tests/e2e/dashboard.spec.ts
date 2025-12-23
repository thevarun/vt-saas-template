import { DashboardPage } from './helpers/DashboardPage';
import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for Dashboard (Story 2.3)
 * Tests dashboard access, personalization, and navigation (AC #14-15, #17)
 */

test.describe('Dashboard', () => {
  test.describe('Authenticated Access (AC #14)', () => {
    test('authenticated users can access dashboard', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Should load dashboard successfully (not redirect)
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);

      // Verify dashboard content is visible
      const greeting = await dashboardPage.getPersonalizedGreeting();

      await expect(greeting).toBeVisible();
    });

    test('dashboard displays without errors', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      // Listen for console errors
      const errors: string[] = [];
      authenticatedPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await dashboardPage.goto();

      // Wait for page to fully load
      await authenticatedPage.waitForLoadState('load');

      // Should have no critical errors
      // Filter out known non-critical errors: favicon, Sentry Spotlight sidecar connection
      const criticalErrors = errors.filter(
        err => !err.includes('favicon') && !err.includes('Sidecar connection'),
      );

      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Personalized Content (AC #15)', () => {
    test('dashboard displays personalized greeting with user data', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Get greeting text
      const greetingText = await dashboardPage.getUserEmail();

      expect(greetingText).toBeDefined();

      // Greeting should be personalized (not generic "Welcome, User")
      expect(greetingText).not.toContain('Welcome, User');
      expect(greetingText).not.toContain('Hello, Guest');
    });

    test('dashboard shows user-specific content', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Dashboard should have personalized elements (greeting, user email, etc.)
      const greeting = await dashboardPage.getPersonalizedGreeting();

      await expect(greeting).toBeVisible();

      // Should not be empty or generic
      const greetingText = (await greeting.textContent())?.trim();

      expect(greetingText?.length ?? 0).toBeGreaterThan(5);
    });
  });

  test.describe('Clean Navigation (AC #16 - Story 2.2)', () => {
    test('no Members or Settings links present', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // From Story 2.2 - Members and Settings removed
      const membersCount = await dashboardPage.hasMembers();
      const settingsCount = await dashboardPage.hasSettings();

      expect(membersCount).toBe(0);
      expect(settingsCount).toBe(0);
    });

    test('home and chat navigation links are present', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Should have Home link
      const homeLink = dashboardPage.getHomeLink();

      await expect(homeLink).toBeVisible();

      // Should have Chat link
      const chatLink = dashboardPage.getChatLink();

      await expect(chatLink).toBeVisible();
    });
  });

  test.describe('Chat Navigation (AC #17)', () => {
    test('can navigate from dashboard to chat', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Navigate to chat via dashboard link
      await dashboardPage.navigateToChat();

      // Should be on chat page
      await expect(authenticatedPage).toHaveURL(/\/chat/);
    });

    test('home link stays on dashboard', async ({ authenticatedPage }) => {
      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Navigate to "home" (which is actually dashboard)
      await dashboardPage.navigateToHome();

      // Should still be on dashboard page
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Responsive Design', () => {
    test('dashboard is usable on mobile viewport', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      // Greeting should be visible
      const greeting = await dashboardPage.getPersonalizedGreeting();

      await expect(greeting).toBeVisible();

      // Navigation should be accessible (may be in hamburger menu on mobile)
      const chatLink = dashboardPage.getChatLink();
      const chatLinkCount = await chatLink.count();

      expect(chatLinkCount).toBeGreaterThan(0);
    });

    test('dashboard is usable on tablet viewport', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 768, height: 1024 });

      const dashboardPage = new DashboardPage(authenticatedPage);

      await dashboardPage.goto();

      const greeting = await dashboardPage.getPersonalizedGreeting();

      await expect(greeting).toBeVisible();

      // On tablet, chat link is in hamburger menu
      const hamburger = authenticatedPage.locator('button[aria-haspopup="menu"]').first();
      await hamburger.click();

      // Wait for dropdown menu to appear and click chat link
      const chatLink = authenticatedPage.locator('[role="menuitem"] a[href*="/chat"], [role="menu"] a[href*="/chat"]').first();
      await chatLink.waitFor({ state: 'visible' });
      await chatLink.click();

      await expect(authenticatedPage).toHaveURL(/\/chat/);
    });
  });
});
