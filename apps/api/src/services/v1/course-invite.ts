import type {
  TPublicApiCourseInviteParam,
  TPublicApiCourseInviteRevokeParam,
  TPublicApiCourseInvitesQuery,
  TPublicApiCreateCourseInvite
} from '@cio/utils/validation/public-api';

import { createStudentInvite, listPaginatedStudentInvites, revokeStudentInvite } from '@api/services/course/invite';
import { assertCourseBelongsToOrganization } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listCourseInvitesService(
  orgId: string,
  params: TPublicApiCourseInviteParam,
  query: TPublicApiCourseInvitesQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return listPaginatedStudentInvites(params.courseId, query);
}

export async function createCourseInviteService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseInviteParam,
  payload: TPublicApiCreateCourseInvite
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return createStudentInvite(params.courseId, actorId, payload);
}

export async function revokeCourseInviteService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseInviteRevokeParam
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return revokeStudentInvite(params.courseId, params.inviteId, actorId);
}
