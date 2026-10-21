import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loginAsAdmin } from '../helpers/login';

test('CSV import and queued bulk polling snackbar', async ({ page }) => {
  test.setTimeout(180_000);

  await loginAsAdmin(page);

  // Part 1: CSV import
  await page.goto('/org/udemy-test/audience/import');

  const csvPath = path.join('/opt/cursor/artifacts', 'demo-import.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');

  await page.getByRole('textbox').fill(csvText);
  await page.getByRole('button', { name: /Review/i }).click();

  await expect(page.getByRole('button', { name: /Import \d+ learners/i })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1_500);

  await page.getByRole('button', { name: /Import \d+ learners/i }).click();

  await expect(page.getByText(/imported|Import complete|result|No seats/i).first()).toBeVisible({
    timeout: 30_000
  });
  await page.waitForTimeout(2_000);

  // Part 2: queued bulk archive with polling snackbar
  await page.goto('/org/udemy-test/audience');
  await expect(page.getByText(/1008 learners|1008 learner/i)).toBeVisible({ timeout: 30_000 });

  // Seeded learners with profiles sit on later pages; queue-demo rows on page 1
  // have no profile and their checkboxes stay disabled.
  await page.goto('/org/udemy-test/audience?page=51');
  const enabledRowCheckbox = page.getByRole('checkbox', { disabled: false }).nth(1);
  await enabledRowCheckbox.click();
  await page.waitForTimeout(1_000);

  const selectAllMatching = page.getByTestId('audience-bulk-select-all-matching');
  await expect(selectAllMatching).toBeVisible({ timeout: 10_000 });
  await selectAllMatching.click();

  await expect(page.getByText(/All 1008 matching learners/i)).toBeVisible();
  await page.waitForTimeout(1_000);

  await page.getByTestId('audience-bulk-actions').click();
  await page.getByRole('menuitem', { name: /^Archive \d+ learners$/i }).click();

  await page.getByTestId('audience-bulk-confirm').click();

  const loadingToast = page.locator('[data-sonner-toast]').filter({ hasText: /1008|Updating|learners/i });
  await expect(loadingToast.first()).toBeVisible({ timeout: 15_000 });

  const successToast = page.locator('[data-sonner-toast]').filter({ hasText: /updated|success|Learners/i });
  await expect(successToast).toBeVisible({ timeout: 120_000 });

  // Hold the resolved toast on screen so the recording captures the transition.
  await page.waitForTimeout(2_000);
});
