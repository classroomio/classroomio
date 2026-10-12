import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

/**
 * SCORM course flow (PR 12).
 *
 * Creates a SCORM course through the new-course modal without uploading a
 * package: the course lands on its empty Package page, the sidebar shows
 * Package instead of Content (no Submissions/Marks), and /lessons redirects
 * to the package. Runs against the Enterprise seed org, which includes SCORM.
 */
test('scorm course: create lands on the package with scorm navigation', async ({ page }) => {
  test.setTimeout(120_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page
    .getByRole('button', { name: /new course|create course/i })
    .first()
    .click();
  await expect(page.getByTestId('new-course-scorm-option')).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('new-course-scorm-option').click();

  const title = `SCORM course ${Date.now()}`;
  await page.getByRole('button', { name: /next/i }).first().click();
  await page.getByRole('button', { name: /next/i }).first().click();

  await page.getByLabel(/course name/i).fill(title);
  await page.getByLabel(/short description|description/i).fill('Created by the PR 12 regression spec.');
  await page
    .getByRole('button', { name: /finish|create/i })
    .first()
    .click();

  await page.waitForURL(/\/courses\/[^/]+\/activities\/[^/]+/, { timeout: 60_000 });

  await expect(page.getByTestId('course-nav-package')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('link', { name: /^submissions$/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^marks$/i })).toHaveCount(0);

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/lessons`);
  await page.waitForURL(/\/courses\/[^/]+\/activities\/[^/]+/, { timeout: 30_000 });
});
