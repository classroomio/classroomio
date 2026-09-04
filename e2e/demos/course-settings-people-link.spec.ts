import { test, expect } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

test('course settings People link opens the course People page', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page.getByText('Modern Web Development with React').first().click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 30_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/settings`);

  const peopleLink = page.getByTestId('course-settings-people-link');
  await peopleLink.scrollIntoViewIfNeeded();
  await expect(peopleLink).toBeVisible();
  await expect(peopleLink).toHaveAttribute('href', `/courses/${courseId}/people`);
  await peopleLink.locator('xpath=ancestor::fieldset[1]').screenshot({
    path: 'test-results/self-enrollment-people-link.png'
  });
  await page.waitForTimeout(1500);
  await peopleLink.click();

  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/people/?$`));
  await page.waitForTimeout(2000);
});
