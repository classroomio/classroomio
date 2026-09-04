import { expect, type Page } from '@playwright/test';

export const DEMO_ADMIN = {
  email: 'admin@test.com',
  password: '123456'
} as const;

export const DEFAULT_ORG_SITE_NAME = 'udemy-test';

/** Admin app login (cloud mode, localhost preview). */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');

  const email = page.getByTestId('auth-login-email');
  const password = page.getByTestId('auth-login-password');

  await email.waitFor({ state: 'visible' });

  // Vite hydrates bound inputs after first paint; filling too early is discarded.
  await expect(async () => {
    await email.fill(DEMO_ADMIN.email);
    await password.fill(DEMO_ADMIN.password);
    await expect(email).toHaveValue(DEMO_ADMIN.email);
    await expect(password).toHaveValue(DEMO_ADMIN.password);
  }).toPass({ timeout: 10_000 });

  await page.getByTestId('auth-login-submit').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
}

/** Org public site (simulates tenant subdomain via ?org= locally). */
export async function openOrgCatalog(page: Page, siteName = DEFAULT_ORG_SITE_NAME) {
  await page.goto(`/?org=${siteName}`);
}
