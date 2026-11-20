import { getCourseById } from '@cio/db/queries/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import type { ContentType } from '@cio/utils/constants';
import { getCourseOutline } from '@cio/utils/functions/course-content';
import { flattenNavigableItems } from '@cio/utils/functions/course-progression';
import { buildCourseContent, DEFAULT_CONTENT_GROUPING, type CourseContent, type CourseContentItem } from './utils';

export type CourseOutlineSummaryItem = { type: ContentType; id: string; title: string };

export type CourseOutlineSummaryEntry =
  | { kind: 'section'; id: string; title: string; items: CourseOutlineSummaryItem[] }
  | ({ kind: 'item' } & CourseOutlineSummaryItem);

async function loadCourseContent(courseId: string): Promise<CourseContent> {
  const [course] = await getCourseById(courseId);
  const rows = await getCourseContentItems(courseId);
  const isContentGroupingEnabled = course?.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;

  return buildCourseContent(rows, isContentGroupingEnabled);
}

function toSummaryItem(item: CourseContentItem): CourseOutlineSummaryItem {
  return { type: item.type, id: item.id, title: item.title };
}

/**
 * Lessons and exercises of a course in the order learners meet them, following the outline.
 */
export async function getOrderedCourseItems(courseId: string): Promise<CourseContentItem[]> {
  const content = await loadCourseContent(courseId);

  return flattenNavigableItems(content);
}

/**
 * Position of each lesson or exercise id in the course outline, for sorting other lists into course order.
 */
export async function getCourseItemRanks(courseId: string): Promise<Map<string, number>> {
  const items = await getOrderedCourseItems(courseId);

  return new Map(items.map((item, index) => [item.id, index]));
}

/**
 * Titles and ids of a course's outline in course order: sections with their items, and items outside any section.
 */
export async function getCourseOutlineSummary(courseId: string): Promise<CourseOutlineSummaryEntry[]> {
  const content = await loadCourseContent(courseId);

  return getCourseOutline(content).map((entry) =>
    entry.kind === 'section'
      ? {
          kind: 'section' as const,
          id: entry.section.id,
          title: entry.section.title,
          items: entry.section.items.map(toSummaryItem)
        }
      : { kind: 'item' as const, ...toSummaryItem(entry.item) }
  );
}
