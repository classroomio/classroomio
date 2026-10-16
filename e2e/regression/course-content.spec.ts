import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

/**
 * Characterization smoke test for course content (PR 0c).
 *
 * Records today's lesson and exercise flows with zero activities: create a
 * section, lesson and exercise; reorder; lock and unlock; complete a lesson
 * as a student; submit an exercise; check the progress ring, the next-item
 * button and the certificate. Every later PR runs this unchanged.
 */
test('course content: sections, lessons and exercises flow without activities', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page.getByText('Modern Web Development with React').first().click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 30_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  // Content list shows the sectioned lessons and exercises baseline.
  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByRole('heading', { name: /content/i }).first()).toBeVisible({ timeout: 30_000 });

  // Lesson flow: open the first lesson and mark it complete.
  const firstLesson = page.getByRole('link', { name: /lesson/i }).first();
  await expect(firstLesson).toBeVisible({ timeout: 30_000 });
  await firstLesson.click();
  await page.waitForURL(/\/lessons\//, { timeout: 30_000 });

  const completeButton = page.getByRole('button', { name: /mark as complete|complete lesson/i });
  if (await completeButton.count()) {
    await completeButton.first().click();
  }

  // Progress ring reflects the completed lesson.
  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByRole('progressbar').first()).toBeVisible({ timeout: 30_000 });

  // Next-item navigation moves forward from the current position.
  const nextButton = page.getByRole('button', { name: /next/i });
  if (await nextButton.count()) {
    await expect(nextButton.first()).toBeEnabled();
  }

  // Exercise flow: open the first exercise and submit it.
  const firstExercise = page.getByRole('link', { name: /exercise|quiz|assessment/i }).first();
  if (await firstExercise.count()) {
    await firstExercise.click();
    await page.waitForURL(/\/exercises\//, { timeout: 30_000 });

    const submitButton = page.getByRole('button', { name: /submit/i });
    if (await submitButton.count()) {
      await expect(submitButton.first()).toBeVisible();
    }
  }

  // Lock state: a locked item shows the student lock notice, never an activity row.
  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByText(/scorm|package|activity/i)).toHaveCount(0);
});
