import type { TPublicApiSetFeaturedCourses } from '@cio/utils/validation/public-api';

import { getCourseById } from '@cio/db/queries/course';
import { reorderOrgCourses } from '@api/services/organization';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertOrgAdmin } from '@api/services/v1/shared';

/**
 * Mirrors `POST /organization/courses/reorder` (`orgAdminMiddleware`, `ZCourseReorder`): the actor must be an org admin.
 * Only courses the dashboard picker offers (published, active, not a template) can be featured.
 */
export async function setPublicApiFeaturedCoursesService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiSetFeaturedCourses
) {
  await assertOrgAdmin(orgId, actorId);

  for (const courseId of payload.courseIds) {
    await assertCourseBelongsToOrganization(orgId, courseId);

    const [course] = await getCourseById(courseId);
    if (!course?.isPublished || course.status !== 'ACTIVE' || course.isTemplate) {
      throw new AppError(`Course ${courseId} is not published`, ErrorCodes.VALIDATION_ERROR, 400, 'courseIds');
    }
  }

  await reorderOrgCourses(
    orgId,
    payload.courseIds.map((id, order) => ({ id, order }))
  );

  return { courseIds: payload.courseIds };
}
