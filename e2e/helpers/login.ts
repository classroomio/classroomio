import type { Page } from '@playwright/test';

export const DEMO_ADMIN = {
  email: 'admin@test.com',
  password: '123456'
} as const;

export const DEFAULT_ORG_SITE_NAME = 'udemy-test';

/** Admin app login (cloud mode, localhost preview). */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('#email').fill(DEMO_ADMIN.email);
  await page.locator('#password').fill(DEMO_ADMIN.password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
}

/** Org public site (simulates tenant subdomain via ?org= locally). */
export async function openOrgCatalog(page: Page, siteName = DEFAULT_ORG_SITE_NAME) {
  await page.goto(`/?org=${siteName}`);
}
