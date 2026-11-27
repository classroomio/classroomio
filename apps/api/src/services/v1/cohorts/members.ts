import type { TEventSource } from '@cio/core/services/posthog';
import type {
  TPublicApiAddCohortMembers,
  TPublicApiCohortMemberParam,
  TPublicApiCohortMembersQuery,
  TPublicApiCohortParam,
  TPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import {
  addCohortMembersSettled,
  listPaginatedCohortPeople,
  removeCohortMemberService,
  updateCohortMemberService,
  type TCohortInviteStatus
} from '@api/services/cohort/cohort';
import { scopeCohortPeopleQueryToViewer } from '@api/services/cohort/invite';
import {
  assertCohortBelongsToOrganization,
  assertCohortMemberOrOrgAdmin,
  assertCohortTeamMemberOrOrgAdmin,
  assertProfileBelongsToOrganization
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiCohortMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  query: TPublicApiCohortMembersQuery
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortMemberOrOrgAdmin(params.cohortId, actorId);
  const scopedQuery = await scopeCohortPeopleQueryToViewer(params.cohortId, actorId!, query);

  return listPaginatedCohortPeople(params.cohortId, scopedQuery);
}

export async function addPublicApiCohortMembersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCohortParam,
  payload: TPublicApiAddCohortMembers,
  source: TEventSource = 'public_api'
) {
  await assertCohortBelongsToOrganization(orgId, params.cohortId);
  await assertCohortTeamMemberOrOrgAdmin(params.cohortId, actorId);

  const profileIds = payload.members.flatMap((member) => (member.profileId ? [member.profileId] : []));
  await Promise.all(profileIds.map((profileId) => assertProfileBelongsToOrganization(orgId, profileId)));

  const results = await addCohortMembersSettled(params.cohortId, payload, source, actorId);

  const added: unknown[] = [];
  const invited: { index: number; email: string; status: TCohortInviteStatus; inviteId: string | null }[] = [];
  const errors: { index: number; email: string | null; profileId: string | null; code: string; message: string }[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.kind === 'added') {
        added.push(result.value.member);
      } else {
        invited.push({
          index,
          email: result.value.email,
          status: result.value.status,
          inviteId: result.value.inviteId
        });
      }

      return;
    }
    const member = payload.members[index]!;
    const reason = result.reason;
    const isKnownError = reason instanceof AppError && reason.statusCode < 500;
    if (!isKnownError) {
      console.error('addPublicApiCohortMembersService entry failed:', reason);
    }
    errors.push({
      index,
      email: member.email ?? null,
      profileId: member.profileId ?? null,
      code: isKnownError ? reason.code : ErrorCodes.INTERNAL_ERROR,
      message: isKnownError ? reason.message : 'Failed to add this member'
    });
  });

  return { added, invited, errors };
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

  return removeCohortMemberService(params.cohortId, params.memberId, actorId);
}
