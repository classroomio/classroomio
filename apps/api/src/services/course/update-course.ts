import { updateCourse } from '@cio/core/services/course/course';
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
  return db.transaction(async (tx) => {
    const { course, conversionOffenders } = await updateCourse(params.courseId, params.courseData, tx);
    const tags = await replaceCourseTags(
      params.orgId,
      params.courseId,
      { tagIds: params.tagIds },
      { updatedByUserId: params.updatedByUserId, dbClient: tx }
    );

    return { course, conversionOffenders, tags };
  });
}
