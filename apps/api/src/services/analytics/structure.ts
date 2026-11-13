import type { CourseContentItem } from '@cio/core/services/course/utils';
import { buildCourseContent, DEFAULT_CONTENT_GROUPING } from '@cio/core/services/course/utils';
import { ANALYTICS_TTL_SECONDS, analyticsStructureKey } from '@cio/core/utils/redis/analytics-cache';
import { getCourseById } from '@cio/db/queries/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import {
  getAnalyticsExerciseMeta,
  type AnalyticsExerciseMeta,
  type AnalyticsOrderedItem
} from '@cio/db/queries/analytics';
import { ContentType } from '@cio/utils/constants';
import { getCourseOutline } from '@cio/utils/functions/course-content';
import { flattenNavigableItems } from '@cio/utils/functions/course-progression';

import { cachedRead } from '@api/utils/redis/cached-read';
import type { AnalyticsCourseStructure, AnalyticsStructureItem } from './types';

function toStructureItem(
  item: CourseContentItem,
  rank: number,
  sectionIds: ReadonlySet<string>,
  meta: AnalyticsExerciseMeta | undefined
): AnalyticsStructureItem {
  const isExercise = item.type === ContentType.Exercise;
  const isPassRequired = meta?.completionPolicy === 'passed';
  const passMark = isPassRequired ? (meta?.passThreshold ?? 100) : null;
  const maxPoints = isExercise ? (meta?.maxPoints ?? 0) : null;
  const sectionId = item.sectionId && sectionIds.has(item.sectionId) ? item.sectionId : null;

  return {
    id: item.id,
    type: isExercise ? 'EXERCISE' : 'LESSON',
    title: item.title,
    rank,
    sectionId,
    isPassRequired,
    passMark,
    isLocked: item.isUnlocked === false,
    maxPoints
  };
}

async function buildCourseStructure(courseId: string): Promise<AnalyticsCourseStructure> {
  const [course] = await getCourseById(courseId);
  const rows = await getCourseContentItems(courseId);
  const exerciseMeta = await getAnalyticsExerciseMeta([courseId]);
  const isGrouped = course?.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
  const content = buildCourseContent(rows, isGrouped);
  const outlineSections = isGrouped
    ? getCourseOutline(content).flatMap((entry) => (entry.kind === 'section' ? [entry.section] : []))
    : [];
  const sectionIds = new Set(outlineSections.map((section) => section.id));
  const metaById = new Map(exerciseMeta.map((meta) => [meta.id, meta]));
  const items = flattenNavigableItems(content)
    .filter((item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise)
    .map((item, rank) => toStructureItem(item, rank, sectionIds, metaById.get(item.id)));
  const sections = outlineSections.map((section, rank) => ({ id: section.id, title: section.title, rank }));

  return { courseId, isGrouped, sections, items };
}

/**
 * A course's outline in student order, with pass rules per exercise. Cached for 10 minutes and dropped by
 * `invalidateAnalyticsCourseStructure` when content order or exercise rules change.
 */
export async function getAnalyticsCourseStructure(orgId: string, courseId: string): Promise<AnalyticsCourseStructure> {
  const entry = await cachedRead(analyticsStructureKey(orgId, courseId), ANALYTICS_TTL_SECONDS.structure, () =>
    buildCourseStructure(courseId)
  );

  return entry.data;
}

export function toOrderedItems(structure: AnalyticsCourseStructure): AnalyticsOrderedItem[] {
  const sectionRankById = new Map(structure.sections.map((section) => [section.id, section.rank]));

  return structure.items.map((item) => ({
    courseId: structure.courseId,
    itemId: item.id,
    itemType: item.type,
    itemRank: item.rank,
    sectionId: item.sectionId,
    sectionRank: item.sectionId ? (sectionRankById.get(item.sectionId) ?? null) : null
  }));
}
