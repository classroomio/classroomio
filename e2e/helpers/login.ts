import { expect, type Page } from '@playwright/test';

export const DEMO_ADMIN = {
  email: 'admin@test.com',
  password: '123456'
} as const;

export const DEFAULT_ORG_SITE_NAME = 'udemy-test';

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
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
}

/** Org public site (simulates tenant subdomain via ?org= locally). */
export async function openOrgCatalog(page: Page, siteName = DEFAULT_ORG_SITE_NAME) {
  await page.goto(`/?org=${siteName}`);
}
