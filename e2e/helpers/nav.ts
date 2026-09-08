import type { Page } from '@playwright/test';

/** Click a top-level org sidebar link by its stable test id (see e2e/README.md). */
export async function clickOrgNav(page: Page, testId: string) {
  await page.getByTestId(testId).click();
}

/** Navigate to org courses list from the admin sidebar. */
export async function goToOrgCourses(page: Page) {
  await clickOrgNav(page, 'org-nav-courses');
}
