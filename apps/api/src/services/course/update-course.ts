import { updateCourse } from '@cio/core/services/course/course';
import { db } from '@cio/db/drizzle';
import { getCourseByIdForUpdate } from '@cio/db/queries/course';
import { getCourseTagsForOrganization } from '@cio/db/queries/tag';
import type { TCourse } from '@cio/db/types';
import { replaceCourseTags } from '@api/services/tag';
import { AppError, ErrorCodes } from '@api/utils/errors';

type TCourseTagChange = { tagIds: string[]; addTagIds?: never } | { addTagIds: string[]; tagIds?: never };

export async function updateCourseWithTags(
  params: {
    courseId: string;
    courseData: Partial<TCourse>;
    orgId: string;
    updatedByUserId: string;
  } & TCourseTagChange
) {
  return db.transaction(async (tx) => {
    // The row lock makes concurrent tag changes on one course wait, so addTagIds reads the tags the previous call saved.
    const [lockedCourse] = await getCourseByIdForUpdate(params.courseId, tx);
    if (!lockedCourse) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    // A tags-only change skips updateCourse, whose checks on unrelated settings
    // (payment link, compliance deadline) would otherwise block tagging.
    const { course, conversionOffenders, publishedNow, publishChange } =
      Object.keys(params.courseData).length > 0
        ? await updateCourse(params.courseId, params.courseData, tx)
        : { course: lockedCourse, conversionOffenders: null, publishedNow: false, publishChange: null };

    const tagIds = params.addTagIds
      ? [
          ...(await getCourseTagsForOrganization(params.orgId, params.courseId, tx)).map((tag) => tag.id),
          ...params.addTagIds
        ]
      : params.tagIds;

    const tags = await replaceCourseTags(
      params.orgId,
      params.courseId,
      { tagIds },
      { updatedByUserId: params.updatedByUserId, dbClient: tx }
    );

    return { course, conversionOffenders, publishedNow, publishChange, tags };
  });
}
