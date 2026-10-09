import { expect, test } from '@playwright/test';
import { installApiMocks } from '../fixtures';

test.describe('software registry', () => {
  test('lists software and filters by search', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/workspace/softwares');

    await expect(page.getByRole('heading', { name: 'My software' })).toBeVisible();
    await expect(page.getByText('Aurora CLI')).toBeVisible();
    await expect(page.getByText('Sentinel Scan')).toBeVisible();

    await page.getByPlaceholder('Search your software').fill('Sentinel');
    await expect(page.getByText('Sentinel Scan')).toBeVisible();
    await expect(page.getByText('Aurora CLI')).toHaveCount(0);
  });

  test('opens a deep-linkable software detail route', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/workspace/software/pkg-1');

    await expect(page).toHaveURL(/\/workspace\/software\/pkg-1$/);
  });
});
