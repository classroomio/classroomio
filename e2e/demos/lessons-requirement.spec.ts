import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin, loginAsStudent } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

async function openCourseContent(page: Page) {
  await goToOrgCourses(page);
  await page.getByText('SOC 2 Security Basics').first().click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 30_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByTestId('lessons-requirement-summary')).toBeVisible({ timeout: 30_000 });
}

test('teacher marks course content as required or optional', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsAdmin(page);
  await openCourseContent(page);

  const summary = page.getByTestId('lessons-requirement-summary');
  const toggles = page.getByTestId('lessons-requirement-toggle');
  await expect(summary).toContainText('0 optional');

  await toggles.first().click();
  await expect(summary).toContainText('1 optional');
  await page.waitForTimeout(1000);

  await page.getByLabel('Content options').click();
  await page.getByRole('menuitem', { name: 'Make everything optional' }).click();
  await expect(summary).toContainText('0 required');
  await page.waitForTimeout(1000);

  await page.getByLabel('Content options').click();
  await page.getByRole('menuitem', { name: 'Make everything required' }).click();
  await expect(summary).toContainText('0 optional');
  await page.waitForTimeout(1000);

  await toggles.nth(1).click();
  await expect(summary).toContainText('1 optional');
  await expect(page.getByTestId('sidebar-requirement-marker').first()).toBeVisible();
  await page.waitForTimeout(2000);
});

test('student sees which content is required', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsStudent(page);
  await page.goto('/organizations');
  await page.getByText('Coursera Test').first().click();
  await page.getByRole('button', { name: 'Continue Learning' }).click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 60_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/lessons`);
  await expect(page.getByTestId('lessons-requirement-summary')).toContainText('0 of 3', { timeout: 30_000 });
  await expect(page.getByTestId('lessons-requirement-chip-required').first()).toBeVisible();
  await expect(page.getByTestId('lessons-requirement-toggle')).toHaveCount(0);
  await page.waitForTimeout(2500);
});
