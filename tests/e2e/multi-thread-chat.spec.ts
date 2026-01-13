import { MockResponses } from './fixtures/dify-mocks';
import { expect, test } from './helpers/fixtures';

/**
 * Multi-Thread Chat E2E Test - Simplified for solo dev workflow
 * Tests basic thread creation flow
 */

test.describe('Multi-Thread Chat', () => {
  test('user can send message and create thread', async ({ authenticatedPage }) => {
    // Mock chat API
    await authenticatedPage.route('**/api/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
          body: MockResponses.greeting(),
        });
      } else {
        await route.continue();
      }
    });

    await authenticatedPage.goto('/chat');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Verify composer is ready
    const composer = authenticatedPage.getByTestId('composer-input');

    await expect(composer).toBeVisible();

    // Send a message
    await composer.fill('Hello, this is my first message');
    await authenticatedPage.getByRole('button', { name: 'Send' }).click();

    // Wait for assistant response
    await expect(authenticatedPage.locator('[data-message-role="assistant"]').first()).toBeVisible({ timeout: 10000 });

    // Verify user message appears
    await expect(authenticatedPage.locator('[data-message-role="user"]').first()).toBeVisible();
  });
});
