import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin, loginAsStudent } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

const COURSE_TITLE = 'SOC 2 Security Basics';

async function openContentPage(page: Page) {
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 60_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByTestId('lessons-requirement-summary')).toBeVisible({ timeout: 30_000 });
}

test('teacher marks course content as required or optional', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);
  await page.getByText(COURSE_TITLE).first().click();
  await openContentPage(page);

  const markers = page.getByTestId('lessons-requirement-marker');
  const toggles = page.getByTestId('lessons-requirement-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(markers).toHaveCount(3);

  await markers.first().hover();
  await page.waitForTimeout(1200);

  await markers.nth(1).hover();
  await page.waitForTimeout(800);
  await toggles.nth(1).click();
  await expect(markers).toHaveCount(2);
  await page.waitForTimeout(1000);

  await page.getByTestId('lessons-content-menu').click();
  await page.getByTestId('lessons-requirement-all-optional').click();
  await expect(markers).toHaveCount(0);
  await page.waitForTimeout(1000);

  await page.getByTestId('lessons-content-menu').click();
  await page.getByTestId('lessons-requirement-all-required').click();
  await expect(markers).toHaveCount(3);
  await page.waitForTimeout(1000);

  await toggles.nth(0).click();
  await expect(markers).toHaveCount(2);
  await expect(page.getByTestId('sidebar-requirement-marker')).toHaveCount(2);
  await page.waitForTimeout(2000);
});

test('student sees which content is required', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsStudent(page);
  await page.goto('/organizations');
  await page.getByText('Coursera Test').first().click();
  await expect(async () => {
    await page.getByTestId('lms-dashboard-hero-action').click();
    await page.waitForURL(/\/courses\/[^/]+/, { timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
  await openContentPage(page);

  await expect(page.getByTestId('lessons-requirement-marker')).toHaveCount(3);
  await expect(page.getByTestId('lessons-requirement-toggle')).toHaveCount(0);
  await page.getByTestId('lessons-requirement-marker').first().hover();
  await page.waitForTimeout(2500);
});
