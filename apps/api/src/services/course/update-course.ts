import { updateCourse } from '@cio/core/services/course/course';
import { db, type TxClient } from '@cio/db/drizzle';
import { getCourseById } from '@cio/db/queries/course';
import type { TCourse } from '@cio/db/types';
import { replaceCourseTags } from '@api/services/tag';
import { AppError, ErrorCodes } from '@api/utils/errors';

// A tags-only change skips updateCourse, whose checks on unrelated settings
// (payment link, compliance deadline) would otherwise block tagging.
async function updateCourseFields(courseId: string, courseData: Partial<TCourse>, tx: TxClient) {
  if (Object.keys(courseData).length > 0) {
    return updateCourse(courseId, courseData, tx);
  }

  const [course] = await getCourseById(courseId, tx);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return { course, conversionOffenders: null };
}

export async function updateCourseWithTags(params: {
  courseId: string;
  courseData: Partial<TCourse>;
  orgId: string;
  updatedByUserId: string;
  tagIds: string[];
}) {
  return db.transaction(async (tx) => {
    const { course, conversionOffenders } = await updateCourseFields(params.courseId, params.courseData, tx);
    const tags = await replaceCourseTags(
      params.orgId,
      params.courseId,
      { tagIds: params.tagIds },
      { updatedByUserId: params.updatedByUserId, dbClient: tx }
    );

    return { course, conversionOffenders, tags };
  });
}
