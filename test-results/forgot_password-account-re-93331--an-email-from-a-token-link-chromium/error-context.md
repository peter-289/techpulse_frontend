# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: forgot_password.spec.ts >> account recovery >> verifies an email from a token link
- Location: e2e/tests/forgot_password.spec.ts:37:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Email verified')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Email verified') with timeout 10000ms
  - waiting for getByText('Email verified')

```

```yaml
- text: Encrypted connection
- button "Back to login"
- paragraph: Email verification
- heading "Verifying your email" [level=1]
- paragraph: We are confirming your email address…
- status
- button "Back to sign in"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { installApiMocks } from '../fixtures';
  3  | 
  4  | test.describe('account recovery', () => {
  5  |   test('requests a reset link and lands on the check-email page', async ({ page }) => {
  6  |     await installApiMocks(page);
  7  |     await page.goto('/forgot-password');
  8  | 
  9  |     await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  10 |     await page.fill('#forgot-email', 'ada@example.test');
  11 |     await page.getByRole('button', { name: 'Send reset link' }).click();
  12 | 
  13 |     await expect(page).toHaveURL(/\/check-email$/);
  14 |   });
  15 | 
  16 |   test('resets the password from a token link', async ({ page }) => {
  17 |     await installApiMocks(page);
  18 |     await page.goto('/password-reset/token-123');
  19 | 
  20 |     await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  21 |     await page.fill('#new-password', 'NewPass123');
  22 |     await page.fill('#confirm-new-password', 'NewPass123');
  23 |     await page.getByRole('button', { name: 'Reset password' }).click();
  24 | 
  25 |     await expect(page.getByText('Your password has been reset')).toBeVisible();
  26 |     await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  27 |   });
  28 | 
  29 |   test('rejects an invalid reset link', async ({ page }) => {
  30 |     await installApiMocks(page);
  31 |     await page.goto('/password-reset');
  32 | 
  33 |     // Route requires a token segment; the SPA falls back to landing for unknown paths.
  34 |     await expect(page).toHaveURL(/\/$/);
  35 |   });
  36 | 
  37 |   test('verifies an email from a token link', async ({ page }) => {
  38 |     await installApiMocks(page);
  39 |     await page.goto('/email-verification?token=verify-me');
  40 | 
> 41 |     await expect(page.getByText('Email verified')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  42 |   });
  43 | });
  44 | 
```