import type {
  TPublicApiAddCohortMembers,
  TPublicApiCohortMemberParam,
  TPublicApiCohortParam,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import {
  addCohortMembersSettled,
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
import { AppError, ErrorCodes } from '@api/utils/errors';

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

  const results = await addCohortMembersSettled(params.cohortId, payload);

  const added: unknown[] = [];
  const errors: { index: number; email: string | null; profileId: string | null; code: string; message: string }[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      added.push(result.value);
      return;
    }
    const member = payload.members[index]!;
    const reason = result.reason;
    errors.push({
      index,
      email: member.email ?? null,
      profileId: member.profileId ?? null,
      code: reason instanceof AppError ? reason.code : ErrorCodes.INTERNAL_ERROR,
      message: reason instanceof Error ? reason.message : 'Unknown error'
    });
  });

  return { added, errors };
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
