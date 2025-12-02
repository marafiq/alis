import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/integration/flows',
  timeout: 30_000,
  globalTimeout: 5 * 60_000,
  expect: {
    timeout: 5_000
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run demo:serve',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  globalSetup: './tests/setup/playwright-global.ts'
});

