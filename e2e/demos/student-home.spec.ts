import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin, signInViaApi } from '../helpers/login';

const ORG_SITE_NAME = 'coursera-test';
const STUDENT = { email: 'enterprise-student@test.com', password: '123456' };
const FREE_PLAN_ORG = 'udemy-test';
const FREE_PLAN_STUDENT = { email: 'student@test.com', password: '123456' };

async function openCustomizeLms(page: Page) {
  await page.goto(`/org/${ORG_SITE_NAME}/settings/customize-lms`);
  await expect(page.getByTestId('customize-lms-student-home')).toBeVisible({ timeout: 30_000 });
}

async function setStudentHome(page: Page, label: string) {
  await page.getByTestId('customize-lms-student-home').click();
  await page.getByRole('option', { name: label, exact: false }).click();
  await page.getByTestId('page-settings-save').click();
  await expect(page.getByTestId('page-settings-save')).toBeHidden({ timeout: 30_000 });
}

test.describe.serial('authenticated student home', () => {
  test('admin can set the student home from Customize LMS', async ({ page }) => {
    test.setTimeout(90_000);

    await loginAsAdmin(page);
    await openCustomizeLms(page);

    await expect(page.getByTestId('customize-lms-student-home')).toContainText('Landing page');
    await setStudentHome(page, 'My Learning');

    await page.reload();
    await expect(page.getByTestId('customize-lms-student-home')).toContainText('My Learning');
  });

  test('signed-in students skip the landing page at the org root', async ({ page }) => {
    test.setTimeout(90_000);

    await signInViaApi(page, STUDENT.email, STUDENT.password);
    await page.goto(`/?org=${ORG_SITE_NAME}`);

    await expect(page).toHaveURL(/\/lms\/mylearning\/?$/, { timeout: 30_000 });
  });

  test('anonymous visitors still see the landing page', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(`/?org=${ORG_SITE_NAME}`);

    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();
    await expect(page.getByRole('link', { name: /join academy|log in/i }).first()).toBeVisible({
      timeout: 30_000
    });
  });

  test('students cannot open LMS pages the org gates by plan', async ({ page }) => {
    test.setTimeout(90_000);

    await signInViaApi(page, FREE_PLAN_STUDENT.email, FREE_PLAN_STUDENT.password);
    await page.goto(`/lms/certificates?org=${FREE_PLAN_ORG}`);

    await expect(page).toHaveURL(/\/lms\/?(\?.*)?$/, { timeout: 30_000 });
    await page.goBack();
    await expect(page).not.toHaveURL(/\/lms\/certificates/);
  });

  test('admin can reset the student home to the landing page', async ({ page }) => {
    test.setTimeout(90_000);

    await loginAsAdmin(page);
    await openCustomizeLms(page);
    await setStudentHome(page, 'Landing page');

    await page.reload();
    await expect(page.getByTestId('customize-lms-student-home')).toContainText('Landing page');
  });
});
