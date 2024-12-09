import pages from '$lib/data/pages.json';
import type { Page } from '$lib/utils/types/page';

/**
 * Get a page by its id
 * @param pageId - The id of the page
 * @returns type Page
 */
export function getPage(pageId: string) {
  return pages.find((page) => page.id === pageId) as Page;
}

/**
 * Get a section by its type
 * @param page - The page
 * @param sectionType - The type of the section
 * @returns type Section | undefined
 */
export function getPageSection(page: Page, sectionType: string) {
  return page.sections.find((section) => section.type === sectionType);
}
