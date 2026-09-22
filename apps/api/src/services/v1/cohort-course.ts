import type {
  TPublicApiAddCourseToCohort,
  TPublicApiCohortCourseParam,
  TPublicApiCohortParam
} from '@cio/utils/validation/public-api';

import { addCourseToCohortService, removeCourseFromCohortService } from '@api/services/cohort/cohort';
import { getCoursesByCohort } from '@cio/db/queries/cohort';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { assertCohortBelongsToOrganization, assertCohortTeamMemberOrOrgAdmin } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiCohortCoursesService(orgId: string, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return getCoursesByCohort(params.cohortId, false);
}

export async function addPublicApiCohortCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiAddCourseToCohort
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  const courseOrganizationId = await getCourseOrganizationId(payload.courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return addCourseToCohortService(params.cohortId, payload);
}

export async function removePublicApiCohortCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortCourseParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return removeCourseFromCohortService(params.cohortId, params.courseId);
}
