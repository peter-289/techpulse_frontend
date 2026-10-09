import { expect, test } from '@playwright/test';
import { installApiMocks } from '../fixtures';

test.describe('session persistence', () => {
  test('keeps the workspace accessible after a full reload', async ({ page }) => {
    await installApiMocks(page);

    await page.goto('/workspace/overview');
    await expect(page.getByRole('heading', { name: 'TechPulse Dashboard' })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/workspace\/overview$/);
    await expect(page.getByRole('heading', { name: 'TechPulse Dashboard' })).toBeVisible();
  });

  test('redirects anonymous visitors to login with the attempted path', async ({ page }) => {
    await installApiMocks(page, { user: null });

    await page.goto('/workspace/overview');
    await expect(page).toHaveURL(/\/login$/);
  });
});
