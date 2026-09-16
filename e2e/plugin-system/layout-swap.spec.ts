import { test, expect } from '@playwright/test';

// These tests require a running dashboard with classroomio.config.ts in place.
// They assert layout structure using data-testid attributes baked into the components.

test.describe('layout swap — sidebar (default)', () => {
  test('renders the sidebar layout container', async ({ page }) => {
    await page.goto('/org/test-org/dash');
    await expect(page.getByTestId('layout-sidebar')).toBeVisible();
    await expect(page.getByTestId('layout-top-nav')).not.toBeAttached();
  });

  test('sidebar contains the org navigation items', async ({ page }) => {
    await page.goto('/org/test-org/dash');
    await expect(page.getByTestId('org-nav-courses')).toBeVisible();
  });
});

test.describe('layout swap — top nav', () => {
  // These tests run with a config fixture that sets layout: topNav()
  test.use({ storageState: 'e2e/fixtures/top-nav-config-state.json' });

  test('renders the top-nav layout container', async ({ page }) => {
    await page.goto('/org/test-org/dash');
    await expect(page.getByTestId('layout-top-nav')).toBeVisible();
    await expect(page.getByTestId('layout-sidebar')).not.toBeAttached();
  });

  test('top nav contains the org navigation items', async ({ page }) => {
    await page.goto('/org/test-org/dash');
    await expect(page.getByTestId('org-nav-courses')).toBeVisible();
  });
});
