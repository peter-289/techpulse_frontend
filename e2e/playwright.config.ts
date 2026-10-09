import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';
const hasExternalTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const systemChromium =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(systemChromium ? { launchOptions: { executablePath: systemChromium } } : {}),
      },
    },
  ],
  ...(hasExternalTarget
    ? {}
    : {
        webServer: {
          command: 'npm run dev -- --port 5173 --strictPort',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
