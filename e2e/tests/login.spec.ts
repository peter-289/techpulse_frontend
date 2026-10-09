import { expect, test } from '@playwright/test';
import { installApiMocks } from '../fixtures';

test.describe('login', () => {
  test('signs in and lands on the workspace overview', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/login');

    await page.fill('#username', 'ada');
    await page.fill('#password', 'secret');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/workspace\/overview$/);
    await expect(page.getByRole('heading', { name: 'TechPulse Dashboard' })).toBeVisible();
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await installApiMocks(page);
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Bad credentials' }) }),
    );

    await page.goto('/login');
    await page.fill('#username', 'ada');
    await page.fill('#password', 'wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid username or password.')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Username is required')).toBeVisible();
  });
});
