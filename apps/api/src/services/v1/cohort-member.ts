import type {
  TPublicApiAddCohortMembers,
  TPublicApiCohortMemberParam,
  TPublicApiCohortParam,
  TPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import {
  addCohortMembers,
  listCohortMembers,
  removeCohortMemberService,
  updateCohortMemberService
} from '@api/services/cohort/cohort';
import { assertCohortBelongsToOrganization, assertCohortTeamMemberOrOrgAdmin } from '@api/services/v1/shared';

export async function listPublicApiCohortMembersService(orgId: string, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return listCohortMembers(params.cohortId);
}

export async function addPublicApiCohortMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiAddCohortMembers
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

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
