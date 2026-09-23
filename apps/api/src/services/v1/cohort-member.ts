import type {
  TPublicApiAddCohortMembers,
  TPublicApiCohortMemberParam,
  TPublicApiCohortParam,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import {
  addCohortMembers,
  listCohortMembersPage,
  removeCohortMemberService,
  updateCohortMemberService
} from '@api/services/cohort/cohort';
import {
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortTeamMemberOrOrgAdmin,
  assertProfileBelongsToOrganization,
  toPublicApiPagination
} from '@api/services/v1/shared';

export async function listPublicApiCohortMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  query: TPublicApiPaginationQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);

  const { items, total } = await listCohortMembersPage(params.cohortId, query);

  return { items, pagination: toPublicApiPagination(query.page, query.limit, total) };
}

export async function addPublicApiCohortMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiAddCohortMembers
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  const profileIds = payload.members.flatMap((member) => (member.profileId ? [member.profileId] : []));
  await Promise.all(profileIds.map((profileId) => assertProfileBelongsToOrganization(orgId, profileId)));

  return addCohortMembers(params.cohortId, payload);
}

export async function updatePublicApiCohortMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortMemberParam,
  payload: TPublicApiUpdateCohortMember
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return updateCohortMemberService(params.cohortId, params.memberId, payload);
}

export async function removePublicApiCohortMemberService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortMemberParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return removeCohortMemberService(params.cohortId, params.memberId);
}
