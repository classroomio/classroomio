import { test, expect } from '@playwright/test';

import { loginAsAdmin } from '../helpers/login';
import { goToOrgCourses } from '../helpers/nav';

test('certificate settings link to the completion rules and back', async ({ page }) => {
  test.setTimeout(90_000);

  await loginAsAdmin(page);
  await goToOrgCourses(page);

  await page.getByText('SOC 2 Security Basics').first().click();
  await page.waitForURL(/\/courses\/[^/]+/, { timeout: 30_000 });

  const courseId = page.url().match(/\/courses\/([^/?#]+)/)?.[1];
  expect(courseId).toBeTruthy();

  await page.goto(`/courses/${courseId}/certificates?tab=settings`);

  const rulesSummary = page.getByTestId('certificate-completion-rules-summary');
  await rulesSummary.scrollIntoViewIfNeeded();
  await expect(rulesSummary).toBeVisible();
  await rulesSummary.locator('xpath=ancestor::fieldset[1]').screenshot({
    path: 'test-results/certificate-completion-rules-summary.png'
  });
  await page.waitForTimeout(1500);

  await page.getByTestId('certificate-settings-completion-rules-link').click();
  await expect(page).toHaveURL(
    new RegExp(`/courses/${courseId}/settings\\?from=certificate-settings(&highlight=completion-rules)?$`)
  );

  const backLink = page.getByTestId('course-settings-back-to-certificate-settings');
  await expect(backLink).toBeInViewport({ timeout: 10_000 });
  await page.waitForTimeout(2000);

  await backLink.click();
  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}/certificates\\?tab=settings$`));
  await expect(rulesSummary).toBeVisible();
  await page.waitForTimeout(1500);
});
