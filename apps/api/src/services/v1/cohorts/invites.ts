import type {
  TPublicApiAssignStudentsToCohort,
  TPublicApiCohortParam,
  TPublicApiInviteStudentsToCohort,
  TPublicApiSetCohortInviteLinkRevoked
} from '@cio/utils/validation/public-api';

import { assignExistingStudentsToCohort, inviteStudentsToCohort } from '@api/services/cohort/invite';
import {
  fetchInviteLinkForResource,
  getOrCreateInviteLinkForResource,
  toggleInviteLinkForResource
} from '@api/services/invite-link';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCohortTeamMemberOrOrgAdmin
} from '@api/services/v1/shared';

export async function invitePublicApiCohortStudentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiInviteStudentsToCohort
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return inviteStudentsToCohort(params.cohortId, payload, actorId);
}

export async function assignPublicApiCohortStudentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiAssignStudentsToCohort
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return assignExistingStudentsToCohort(params.cohortId, payload);
}

export async function getPublicApiCohortInviteLinkService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return fetchInviteLinkForResource('COHORT', params.cohortId);
}

export async function createPublicApiCohortInviteLinkService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return getOrCreateInviteLinkForResource('COHORT', params.cohortId, actorId);
}

export async function setPublicApiCohortInviteLinkRevokedService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiSetCohortInviteLinkRevoked
) {
  assertAutomationActor(actorId);
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  return toggleInviteLinkForResource('COHORT', params.cohortId, payload.isRevoked, actorId);
}
