import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '..',
  testMatch: ['.github/demo-runs/pr-*.spec.ts', 'e2e/demos/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // loginAsAdmin waits up to 60s for the authenticated shell; keep headroom above that.
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? 'http://localhost:4173',
    video: 'on',
    screenshot: 'on',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome']
  }
});
