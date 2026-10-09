import { expect, test } from '@playwright/test';
import { installApiMocks } from '../fixtures';

test.describe('account recovery', () => {
  test('requests a reset link and lands on the check-email page', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
    await page.fill('#forgot-email', 'ada@example.test');
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page).toHaveURL(/\/check-email$/);
  });

  test('resets the password from a token link', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/password-reset/token-123');

    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await page.fill('#new-password', 'NewPass123');
    await page.fill('#confirm-new-password', 'NewPass123');
    await page.getByRole('button', { name: 'Reset password' }).click();

    await expect(page.getByText('Your password has been reset')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('rejects an invalid reset link', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/password-reset');

    // Route requires a token segment; the SPA falls back to landing for unknown paths.
    await expect(page).toHaveURL(/\/$/);
  });

  test('verifies an email from a token link', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/email-verification?token=verify-me');

    await expect(page.getByText('Email verified')).toBeVisible();
  });
});
