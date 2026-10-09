import { expect, test } from '@playwright/test';
import { installApiMocks } from '../fixtures';

test.describe('upload software', () => {
  test('renders the upload workspace for authenticated users', async ({ page }) => {
    await installApiMocks(page);
    await page.goto('/workspace/upload-software');

    await expect(page).toHaveURL(/\/workspace\/upload-software$/);
    await expect(page.getByRole('heading', { name: 'Publish Software' })).toBeVisible();
    await expect(page.getByText('Software Information')).toBeVisible();
  });
});
