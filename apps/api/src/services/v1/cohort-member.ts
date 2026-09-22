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
import { assertCohortBelongsToOrganization } from '@api/services/v1/shared';

export async function listPublicApiCohortMembersService(orgId: string, params: TPublicApiCohortParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return listCohortMembers(params.cohortId);
}

export async function addPublicApiCohortMembersService(
  orgId: string,
  params: TPublicApiCohortParam,
  payload: TPublicApiAddCohortMembers
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return addCohortMembers(params.cohortId, payload);
}

export async function updatePublicApiCohortMemberService(
  orgId: string,
  params: TPublicApiCohortMemberParam,
  payload: TPublicApiUpdateCohortMember
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return updateCohortMemberService(params.cohortId, params.memberId, payload);
}

export async function removePublicApiCohortMemberService(orgId: string, params: TPublicApiCohortMemberParam) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);

  return removeCohortMemberService(params.cohortId, params.memberId);
}
