import { expect, type Page } from '@playwright/test';

/** Enterprise org admin — unlocks license-gated features for PR demos. */
export const DEMO_ADMIN = {
  email: 'enterprise@test.com',
  password: '123456'
} as const;

export const DEFAULT_ORG_SITE_NAME = 'coursera-test';

/** Admin app login (cloud mode, localhost preview). */
export async function loginAsAdmin(page: Page) {
  const baseURL = process.env.DEMO_BASE_URL ?? 'http://localhost:4173';

  // Same-origin auth via the dashboard proxy — avoids Svelte hydration races on
  // bound login fields and stores session cookies on the page origin.
  const response = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password },
    headers: { Origin: baseURL, 'Content-Type': 'application/json' }
  });

  expect(response.ok()).toBeTruthy();
  await page.goto('/');
  await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible({ timeout: 60_000 });
}

/** Org public site (simulates tenant subdomain via ?org= locally). */
export async function openOrgCatalog(page: Page, siteName = DEFAULT_ORG_SITE_NAME) {
  await page.goto(`/?org=${siteName}`);
}
