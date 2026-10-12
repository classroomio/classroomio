import { expect, test } from '@playwright/test';
import { join } from 'node:path';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

/**
 * SCORM package demo (PR 15).
 *
 * Uploads the hand-written SCORM 1.2 fixture to a course SCORM item, waits for
 * it to reach `ready` with its modules listed, and opens the Results tab.
 * Uses `packages/activity-packages/test/fixtures/scorm12-minimal.zip` so the
 * run needs no vendor export. Runs against the Enterprise seed org, which
 * includes SCORM.
 */
test('scorm package: upload fixture, ready modules, results tab', async ({ page }) => {
  test.setTimeout(240_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page.getByText('Modern Web Development with React').first().click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 30_000 });

  await page
    .getByRole('button', { name: /add content/i })
    .first()
    .click();
  await page
    .getByText(/SCORM package/i)
    .first()
    .click();

  await page.getByLabel(/package title/i).fill(`Demo package ${Date.now()}`);
  await page
    .getByRole('button', { name: /create|add|next|save/i })
    .first()
    .click();

  await page.waitForURL(/\/courses\/[^/]+\/activities\/[^/]+/, { timeout: 60_000 });

  const fixture = join(
    __dirname,
    '..',
    '..',
    'packages',
    'activity-packages',
    'test',
    'fixtures',
    'scorm12-minimal.zip'
  );

  const dropzone = page.getByTestId('activity-package-dropzone');
  await expect(dropzone).toBeVisible({ timeout: 30_000 });

  const fileInput = dropzone.locator('input[type="file"]');
  await fileInput.setInputFiles(fixture);

  await expect(page.getByText(/processing package|processing/i).first()).toBeVisible({ timeout: 30_000 });

  await expect(page.getByText(/SCORM 1\.2/i).first()).toBeVisible({ timeout: 180_000 });

  await page.getByRole('tab', { name: /results/i }).click();
  await expect(page.getByText(/no results yet|enrolled|average score/i).first()).toBeVisible({ timeout: 30_000 });

  await page.waitForTimeout(2_000);
});
