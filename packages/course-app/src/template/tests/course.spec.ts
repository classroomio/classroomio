import { test, expect } from '@playwright/test';

const PORT = process.env.PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;

test.describe('Course Page', () => {
  // Mock data for our tests
  const mockCourseData = {
    metadata: {
      title: 'Test Course'
    },
    sections: [
      {
        title: 'Section 1',
        sectionSlug: 'section-1',
        published: true,
        children: [
          { title: 'Lesson 1', filename: 'lesson-1.md' },
          { title: 'Lesson 2', filename: 'lesson-2.md' }
        ]
      },
      {
        title: 'Section 2',
        sectionSlug: 'section-2',
        published: true,
        children: [{ title: 'Lesson 3', filename: 'lesson-3.md' }]
      }
    ]
  };

  const mockLessonContent = {
    content: '<h1>Test Lesson Content</h1>'
  };

  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/api/lesson/**', async (route) => {
      await route.fulfill({
        json: mockLessonContent
      });
    });

    // Navigate to the course page
    await page.goto(`${BASE_URL}/course/test-course`);
  });

  test('loads initial lesson content correctly', async ({ page }) => {
    // Check if course title is displayed
    await expect(page.locator('text=Test Course')).toBeVisible();

    // Check if first lesson is loaded by default
    await expect(page.locator('text=Lesson 1')).toBeVisible();
    await expect(page.locator('h1:has-text("Test Lesson Content")')).toBeVisible();
  });

  test('sidebar navigation works correctly', async ({ page }) => {
    // Click on second lesson
    await page.click('text=Lesson 2');

    // Verify lesson content changed
    await expect(page.locator('h1:has-text("Test Lesson Content")')).toBeVisible();

    // Verify active lesson indicator
    await expect(page.locator('.border-black:has-text("Lesson 2")')).toBeVisible();
  });

  test('toggles dark mode correctly', async ({ page }) => {
    // Check initial light mode
    await expect(page.locator('body')).not.toHaveClass(/dark/);

    // Click dark mode toggle
    await page.click('button:has(svg)'); // Adjust selector based on your Moon/Light icon implementation

    // Verify dark mode is enabled
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('mobile sidebar toggle works', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify sidebar is hidden initially
    await expect(page.locator('.translate-x-full')).toBeVisible();

    // Click menu button
    await page.click('button:has(.carbon-icons-svelte-Menu)');

    // Verify sidebar is visible
    await expect(page.locator('.translate-x-0')).toBeVisible();

    // Click lesson and verify sidebar closes
    await page.click('text=Lesson 2');
    await expect(page.locator('.translate-x-full')).toBeVisible();
  });

  test('handles unpublished sections correctly', async ({ page }) => {
    // Add test for sections marked as "coming soon"
    await expect(page.locator('text=coming soon')).toBeVisible();

    // Verify unpublished sections can't be expanded
    await page.click('text=coming soon');
    await expect(page.locator('text=Lesson 3')).not.toBeVisible();
  });

  test('back to course page link works', async ({ page }) => {
    await page.click('text=Back to course page');
    await expect(page).toHaveURL('/courses');
  });
});
