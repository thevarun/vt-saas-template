/**
 * Page Object Model for Authentication pages (sign-in, sign-up, sign-out)
 * Provides reusable methods for auth flow interactions
 */

import type { Page } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  // Navigation methods
  async goToSignUp() {
    await this.page.goto('/sign-up');
  }

  async goToSignIn() {
    await this.page.goto('/sign-in');
  }

  async goToSignOut() {
    // Navigate to sign-out and wait for the redirect
    await this.page.goto('/sign-out', { waitUntil: 'networkidle' });
    // Give extra time for sign-out and redirect to complete
    await this.page.waitForTimeout(2000);
  }

  // Sign-up methods
  async fillSignUpForm(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
  }

  async submitSignUpForm() {
    await this.page.click('button[type="submit"]');
  }

  async signUp(email: string, password: string) {
    await this.fillSignUpForm(email, password);
    await this.submitSignUpForm();
  }

  // Sign-in methods
  async fillSignInForm(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
  }

  async submitSignInForm() {
    await this.page.click('button[type="submit"]');
  }

  async signIn(email: string, password: string) {
    await this.goToSignIn();
    await this.fillSignInForm(email, password);
    await this.submitSignInForm();
    // Wait for redirect to complete
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }

  // Verification methods
  async getVerificationMessage() {
    return this.page.getByText('Check your email!');
  }

  async getErrorMessage() {
    return this.page.getByText(/invalid|error/i).first();
  }

  // Element locators
  getEmailInput() {
    return this.page.locator('input[name="email"]');
  }

  getPasswordInput() {
    return this.page.locator('input[name="password"]');
  }

  getSubmitButton() {
    return this.page.locator('button[type="submit"]');
  }

  getSignUpLink() {
    return this.page.locator('a').filter({ hasText: /sign up|create account/i }).first();
  }

  getSignInLink() {
    return this.page.locator('a:has-text("Sign in")');
  }
}
