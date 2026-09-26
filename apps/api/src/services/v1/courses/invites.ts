import type {
  TPublicApiCourseInviteParam,
  TPublicApiCourseInviteRevokeParam,
  TPublicApiCourseInvitesQuery,
  TPublicApiCreateCourseInvite
} from '@cio/utils/validation/public-api';

import { createStudentInvite, listPaginatedStudentInvites, revokeStudentInvite } from '@api/services/course/invite';
import {
  assertAutomationActor,
  assertCourseBelongsToOrganization,
  assertCourseTeamMemberOrOrgAdmin
} from '@api/services/v1/shared';

export async function listCourseInvitesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseInviteParam,
  query: TPublicApiCourseInvitesQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  return listPaginatedStudentInvites(params.courseId, query);
}

export async function createCourseInviteService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseInviteParam,
  payload: TPublicApiCreateCourseInvite
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  return createStudentInvite(params.courseId, actorId, payload);
}

export async function revokeCourseInviteService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseInviteRevokeParam
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCourseTeamMemberOrOrgAdmin(params.courseId, actorId);

  return revokeStudentInvite(params.courseId, params.inviteId, actorId);
}
