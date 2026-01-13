/**
 * Page Object Model for Dashboard page
 * Provides methods for dashboard navigation and verification
 */

import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/dashboard');
  }

  // Verification methods
  async getPersonalizedGreeting() {
    // Target greeting in main content area, not sidebar
    return this.page.locator('main h1, main h2, [data-testid="greeting"]').first();
  }

  async getUserEmail() {
    // Extract email from greeting or user profile display
    const greeting = await this.getPersonalizedGreeting();
    const text = await greeting.textContent();
    return text;
  }

  // Navigation links
  getChatLink() {
    // Use .first() to avoid strict mode violation when multiple chat links exist
    return this.page.locator('a[href*="/chat"], button:has-text("Chat")').first();
  }

  getHomeLink() {
    // Select the "Home" navigation link, not the logo link
    return this.page.locator('a[href="/dashboard"]:has-text("Home")');
  }

  async navigateToChat() {
    await this.getChatLink().click();
    await this.page.waitForURL(/\/chat/);
  }

  async navigateToHome() {
    await this.getHomeLink().click();
    await this.page.waitForURL(/\/dashboard/);
  }

  // Verify removed links don't exist (from Story 2.2)
  async hasMembers() {
    return this.page.locator('a:has-text("Members"), button:has-text("Members")').count();
  }

  async hasSettings() {
    return this.page.locator('a:has-text("Settings"), button:has-text("Settings")').count();
  }

  // Sign out
  getSignOutButton() {
    return this.page.locator('button:has-text("Sign Out"), a[href*="sign-out"]');
  }

  async signOut() {
    await this.getSignOutButton().click();
    await this.page.waitForURL(/\/(sign-in)?$/);
  }
}
