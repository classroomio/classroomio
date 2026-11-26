import { expect, type Page } from '@playwright/test';

/** Enterprise org admin — unlocks license-gated features for PR demos. */
export const DEMO_ADMIN = {
  email: 'enterprise@test.com',
  password: '123456'
} as const;

export const DEFAULT_ORG_SITE_NAME = 'coursera-test';

/** Enterprise org student — same tenant as `DEMO_ADMIN`. */
export const DEMO_STUDENT = {
  email: 'enterprise-student@test.com',
  password: '123456'
} as const;

/** Admin app login (cloud mode, localhost preview). */
export async function loginAsAdmin(page: Page) {
  await signIn(page, DEMO_ADMIN);
  await page.goto('/');
  await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible({ timeout: 60_000 });
}

/** Student login (cloud mode, localhost preview). */
export async function loginAsStudent(page: Page) {
  await signIn(page, DEMO_STUDENT);
}

async function signIn(page: Page, credentials: { email: string; password: string }) {
  const baseURL = process.env.DEMO_BASE_URL ?? 'http://localhost:4173';

  // Same-origin auth via the dashboard proxy — avoids Svelte hydration races on
  // bound login fields and stores session cookies on the page origin.
  const response = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email: credentials.email, password: credentials.password },
    headers: { Origin: baseURL, 'Content-Type': 'application/json' }
  });

  expect(response.ok()).toBeTruthy();
}

/** Org public site (simulates tenant subdomain via ?org= locally). */
export async function openOrgCatalog(page: Page, siteName = DEFAULT_ORG_SITE_NAME) {
  await page.goto(`/?org=${siteName}`);
}
