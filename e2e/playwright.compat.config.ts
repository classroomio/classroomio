import { defineConfig, devices } from '@playwright/test';

// Self-contained SCORM compatibility run: the spec boots its own stub
// content origin, so no dashboard preview or API is required. Desktop
// engines run the full boot flow; mobile viewports cover responsive layout.
export default defineConfig({
  testDir: '..',
  testMatch: ['e2e/regression/scorm-compatibility.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-compat' }]],
  outputDir: 'test-results-compat',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } }
  ]
});
