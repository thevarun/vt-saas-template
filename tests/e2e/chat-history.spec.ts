/**
 * E2E Tests for Chat History - Simplified for solo dev workflow
 * Tests core chat message flow
 */

import { MockResponses } from './fixtures/dify-mocks';
import { ChatPage } from './helpers/ChatPage';
import { expect, test } from './helpers/fixtures';

test.describe('Chat History', () => {
  test('messages appear after sending and receiving', async ({ authenticatedPage }) => {
    const chatPage = new ChatPage(authenticatedPage);

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

    await chatPage.goto();

    await expect(authenticatedPage.locator('[data-testid="composer-input"]')).toBeVisible();

    // Send a message
    await chatPage.sendMessage('Hello');
    await chatPage.waitForAIResponse();

    // Verify user message appears
    await expect(authenticatedPage.locator('[data-message-role="user"]').first()).toBeVisible();

    // Verify assistant message appears
    await expect(authenticatedPage.locator('[data-message-role="assistant"]').first()).toBeVisible();
  });
});
