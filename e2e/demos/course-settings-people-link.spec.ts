import { test, expect } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

test('course settings People link opens the course People page', async ({ page }) => {
  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page.getByText('Modern Web Development with React').first().click();
  await page.waitForURL(/\/courses\/[^/]+/);

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/settings`);

  const peopleLink = page.getByTestId('course-settings-people-link');
  await peopleLink.scrollIntoViewIfNeeded();
  await expect(peopleLink).toBeVisible();
  await peopleLink.click();

  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/people/?$`));
  await expect(page.getByRole('heading', { name: 'People' })).toBeVisible();
});
