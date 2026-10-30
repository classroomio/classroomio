import { updateCourse } from '@cio/core/services/course/course';
import { invalidateInsightsCourseStructure } from '@cio/core/utils/redis/insights-cache';
import { db } from '@cio/db/drizzle';
import type { TCourse } from '@cio/db/types';
import { replaceCourseTags } from '@api/services/tag';

export async function updateCourseWithTags(params: {
  courseId: string;
  courseData: Partial<TCourse>;
  orgId: string;
  updatedByUserId: string;
  tagIds: string[];
}) {
  const result = await db.transaction(async (tx) => {
    const { course, conversionOffenders, publishedNow, publishChange, groupingChanged } = await updateCourse(
      params.courseId,
      params.courseData,
      tx
    );
    const tags = await replaceCourseTags(
      params.orgId,
      params.courseId,
      { tagIds: params.tagIds },
      { updatedByUserId: params.updatedByUserId, dbClient: tx }
    );

    return { course, conversionOffenders, publishedNow, publishChange, groupingChanged, tags };
  });

  if (result.groupingChanged) {
    void invalidateInsightsCourseStructure(params.courseId);
  }

  return result;
}
