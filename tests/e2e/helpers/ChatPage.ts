/**
 * Page Object Model for Chat page
 * Provides methods for interacting with the AI chat interface
 */

import type { Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/chat/dify');
  }

  // Message interaction methods
  async typeMessage(message: string) {
    // Assistant UI renders as a textarea element
    const composer = this.page.locator('[data-testid="composer-input"]').first();
    await composer.waitFor({ state: 'visible' });
    await composer.click();
    // Clear any existing text first
    await composer.clear();
    // Use pressSequentially() for reliable text input with proper events
    await composer.pressSequentially(message, { delay: 50 });
    // Wait a bit for the component to process the input
    await this.page.waitForTimeout(500);
  }

  async sendMessage(message?: string) {
    if (message) {
      await this.typeMessage(message);
    }

    // Click send button - Assistant UI renders it as a button with "Send" text
    const sendButton = this.page.locator('button:has-text("Send")').first();
    await sendButton.waitFor({ state: 'visible' });
    await sendButton.click();
  }

  async sendMessageAndWaitForResponse(message: string) {
    await this.sendMessage(message);

    // Wait for AI response to appear (look for streaming indicator or message)
    await this.waitForAIResponse();
  }

  async waitForAIResponse() {
    // Wait for assistant message to appear
    // Assistant UI typically uses role="assistant" or similar data attributes
    await this.page.waitForSelector('[role="assistant"], [data-message-role="assistant"]', {
      timeout: 15000,
    });
  }

  // Verification methods
  async getLastUserMessage() {
    return this.page.locator('[role="user"], [data-message-role="user"]').last();
  }

  async getLastAIMessage() {
    return this.page.locator('[role="assistant"], [data-message-role="assistant"]').last();
  }

  async getAllMessages() {
    return this.page.locator('[role="user"], [role="assistant"], [data-message-role]').all();
  }

  async getMessageCount() {
    const messages = await this.getAllMessages();
    return messages.length;
  }

  // Loading state
  getLoadingIndicator() {
    return this.page.locator('[aria-label*="Loading"], [data-testid="loading"]');
  }

  async isLoading() {
    return this.getLoadingIndicator().isVisible();
  }

  // Error state
  getErrorBanner() {
    return this.page.locator('[role="alert"], .error-banner, [data-testid="error"]').first();
  }

  async hasError() {
    return this.getErrorBanner().isVisible();
  }

  // Composer (input area)
  getComposer() {
    return this.page.locator('textarea[placeholder*="Type your message"], [data-testid="composer-input"]').first();
  }

  async isComposerFocused() {
    const composer = this.getComposer();
    return composer.evaluate(el => el === document.activeElement);
  }

  // Multi-line input
  async typeMultiLineMessage(lines: string[]) {
    const composer = this.getComposer();
    await composer.click();

    for (let i = 0; i < lines.length; i++) {
      await composer.type(lines[i]!);
      if (i < lines.length - 1) {
        // Shift+Enter for new line (don't send)
        await this.page.keyboard.press('Shift+Enter');
      }
    }
  }

  async sendWithEnter() {
    await this.page.keyboard.press('Enter');
  }

  // Thread navigation
  async gotoThread(threadId: string) {
    await this.page.goto(`/chat/dify/${threadId}`);
  }

  // History/scroll methods for regression testing

  /**
   * Get all rendered messages (both user and assistant)
   * Used to verify history loaded correctly
   */
  async getHistoricalMessages() {
    return this.page.locator('[data-message-role]').all();
  }

  /**
   * Get the role attributes of all messages in order
   * Used to verify correct user/assistant alternation
   */
  async getMessageRoles(): Promise<(string | null)[]> {
    const messages = await this.page.locator('[data-message-role]').all();
    return Promise.all(messages.map(m => m.getAttribute('data-message-role')));
  }

  /**
   * Check if the thread viewport is scrollable
   * Returns true if content exceeds visible area
   */
  async isViewportScrollable(): Promise<boolean> {
    return this.page.evaluate(() => {
      const viewport = document.querySelector('[class*="overflow-y-auto"]');
      return viewport ? viewport.scrollHeight > viewport.clientHeight : false;
    });
  }

  /**
   * Get scroll metrics from the thread viewport
   */
  async getViewportScrollMetrics(): Promise<{ scrollHeight: number; clientHeight: number; scrollTop: number } | null> {
    return this.page.evaluate(() => {
      const viewport = document.querySelector('[class*="overflow-y-auto"]');
      if (!viewport) {
        return null;
      }
      return {
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
        scrollTop: viewport.scrollTop,
      };
    });
  }

  /**
   * Scroll the thread viewport to the top
   */
  async scrollToTop() {
    await this.page.evaluate(() => {
      const viewport = document.querySelector('[class*="overflow-y-auto"]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    });
  }

  /**
   * Scroll the thread viewport to the bottom
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      const viewport = document.querySelector('[class*="overflow-y-auto"]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }

  /**
   * Check if the page body has vertical overflow
   * Should be false - chat should scroll internally, not the page
   */
  async hasPageOverflow(): Promise<boolean> {
    return this.page.evaluate(() => {
      return document.body.scrollHeight > document.body.clientHeight;
    });
  }

  /**
   * Get the "Jump to latest" scroll button
   */
  getScrollToBottomButton() {
    return this.page.getByText('Jump to latest');
  }
}
