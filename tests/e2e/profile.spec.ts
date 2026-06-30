import { expect, test } from './helpers/fixtures';

/**
 * E2E Tests for User Profile Page
 * Tests profile rendering, form fields, and danger zone
 */

test.describe('User Profile', () => {
  test('[P1] should display profile page with user information', async ({ authenticatedPage }) => {
    // GIVEN: User navigates to profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // THEN: Profile heading is visible
    await expect(authenticatedPage.getByRole('heading', { level: 1 })).toBeVisible();

    // AND: Form fields are present
    await expect(authenticatedPage.locator('#email')).toBeVisible();
    await expect(authenticatedPage.locator('#username')).toBeVisible();
    await expect(authenticatedPage.locator('#displayName')).toBeVisible();
  });

  test('[P1] should display email as read-only', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // THEN: Email field is visible and disabled
    const emailField = authenticatedPage.locator('#email');

    await expect(emailField).toBeVisible();
    await expect(emailField).toBeDisabled();
  });

  test('[P1] should have editable username and display name fields', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // THEN: Username and display name fields are editable
    const usernameField = authenticatedPage.locator('#username');
    const displayNameField = authenticatedPage.locator('#displayName');

    await expect(usernameField).toBeEnabled();
    await expect(displayNameField).toBeEnabled();
  });

  test('[P1] should have save button', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // THEN: Save button is visible
    await expect(authenticatedPage.locator('button[type="submit"]')).toBeVisible();
  });

  test('[P2] should display danger zone with delete account option', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // THEN: Danger zone section is visible with delete button
    await expect(authenticatedPage.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('[P2] should show delete confirmation dialog when delete is clicked', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page
    await authenticatedPage.goto('/dashboard/user-profile');

    // WHEN: User clicks delete button
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();

    // THEN: Confirmation dialog appears with cancel and confirm options
    await expect(authenticatedPage.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('button', { name: /confirm|delete/i }).last()).toBeVisible();
  });

  test('[P2] should close delete dialog when cancel is clicked', async ({ authenticatedPage }) => {
    // GIVEN: User is on profile page with delete dialog open
    await authenticatedPage.goto('/dashboard/user-profile');
    await authenticatedPage.getByRole('button', { name: /delete/i }).click();

    await expect(authenticatedPage.getByRole('button', { name: /cancel/i })).toBeVisible();

    // WHEN: User clicks cancel
    await authenticatedPage.getByRole('button', { name: /cancel/i }).click();

    // THEN: Dialog is closed (cancel button no longer visible in dialog)
    await expect(authenticatedPage.getByRole('alertdialog')).toBeHidden();
  });
});
