import { test, expect } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';

test('admin can sign in with test hooks', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).not.toHaveURL(/\/login/);
});
