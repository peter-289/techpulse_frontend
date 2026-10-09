import { expect, test } from '@playwright/test';
import { adminUser, installApiMocks } from '../fixtures';

test.describe('admin console', () => {
  test('loads for admin sessions', async ({ page }) => {
    await installApiMocks(page, { user: adminUser });
    await page.goto('/workspace/admin');

    await expect(page).toHaveURL(/\/workspace\/admin$/);
    await expect(page.getByText('Dashboard Overview')).toBeVisible();
  });

  test('redirects non-admins to the overview', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/workspace/admin');

    await expect(page).toHaveURL(/\/workspace\/overview$/);
  });
});
