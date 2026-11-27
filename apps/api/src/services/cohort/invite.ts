import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCohortById, getCohortMemberRole, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { ROLE } from '@cio/utils/constants';
import type { TAudienceImportRowStatus } from '@cio/utils/validation/organization';
import type {
  TInviteStudentsToCohort,
  TAssignExistingStudentsToCohort,
  TCohortPeopleMembership
} from '@cio/utils/validation/cohort';
import {
  assignAudienceToCourses,
  importAudienceMembers,
  revokeAudienceInviteAccess
} from '@api/services/organization/audience';
import type { TEventSource } from '@cio/core/services/posthog';

/**
 * Invite students to a single cohort by email CSV.
 *
 * Thin wrapper that hardcodes `cohortIds = [cohortId]` and delegates to
 * `importAudienceMembers`. Lets a Cohort ADMIN/TUTOR (or org admin) issue org
 * invites scoped to *their own* cohort, without granting org-wide invite rights.
 */
export async function inviteStudentsToCohort(
  cohortId: string,
  data: TInviteStudentsToCohort,
  invitedByProfileId: string,
  source: TEventSource = 'dashboard'
) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  return importAudienceMembers(
    cohort.organizationId,
    {
      recipientCsv: data.recipientCsv,
      cohortIds: [cohortId],
      sendEmail: data.sendEmail,
      allCourses: false,
      allCohorts: false
    },
    invitedByProfileId,
    source
  );
}

/**
 * Assign existing student profiles (already members of the org audience) to a
 * single cohort. Same scoping logic as `inviteStudentsToCohort` — restricted
 * to one cohort at a time so the caller's cohort-admin permission is enough.
 */
export async function assignExistingStudentsToCohort(
  cohortId: string,
  data: TAssignExistingStudentsToCohort,
  source: TEventSource = 'dashboard',
  actorProfileId: string | null = null
) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  return assignAudienceToCourses(
    cohort.organizationId,
    {
      profileIds: data.profileIds,
      cohortIds: [cohortId],
      sendEmail: data.sendEmail
    },
    source,
    actorProfileId
  );
}

async function getCohortOrThrow(cohortId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  return cohort;
}

/**
 * Whether `profileId` is a tutor or admin of the cohort, or an admin of its organization.
 */
export async function isCohortTeamMember(cohortId: string, profileId: string): Promise<boolean> {
  const [roleId, isOrgAdmin] = await Promise.all([
    getCohortMemberRole(cohortId, profileId),
    isOrgAdminByCohortId(cohortId, profileId)
  ]);

  return roleId === ROLE.TUTOR || roleId === ROLE.ADMIN || isOrgAdmin;
}

/**
 * Invited people are visible only to the cohort team: anyone else gets 403 for `membership: 'invited'` and a
 * joined-only list otherwise.
 * @returns The query to list cohort people with for this viewer
 */
export async function scopeCohortPeopleQueryToViewer<TQuery extends { membership?: TCohortPeopleMembership }>(
  cohortId: string,
  profileId: string,
  query: TQuery
): Promise<TQuery> {
  const isTeamMember = await isCohortTeamMember(cohortId, profileId);
  if (isTeamMember) return query;

  if (query.membership === 'invited') {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 403);
  }

  return { ...query, membership: 'joined' };
}

export async function assertCohortTeamMember(cohortId: string, profileId: string): Promise<void> {
  const isTeamMember = await isCohortTeamMember(cohortId, profileId);
  if (!isTeamMember) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 403);
  }
}

const COHORT_RESEND_REFUSALS: Partial<Record<TAudienceImportRowStatus, () => AppError>> = {
  is_staff: () => new AppError('This email belongs to an admin or tutor', ErrorCodes.STAFF_CANNOT_ENROLL, 409, 'email'),
  archived: () =>
    new AppError('This email belongs to an archived organization member', ErrorCodes.ORG_MEMBER_ARCHIVED, 409, 'email'),
  over_seat_limit: () => new AppError('Your plan has no student seats left', ErrorCodes.UPGRADE_REQUIRED, 403),
  invalid_email: () => new AppError('A valid email address is required', ErrorCodes.VALIDATION_ERROR, 400, 'email'),
  missing_email: () => new AppError('A valid email address is required', ErrorCodes.VALIDATION_ERROR, 400, 'email')
};

/**
 * Sends `email` a fresh link to their organization invite with this cohort on it.
 * Throws when nothing was sent: staff, archived members, no free student seat, or an invalid email.
 */
export async function resendCohortInvite(cohortId: string, email: string, invitedByProfileId: string) {
  const cohort = await getCohortOrThrow(cohortId);
  const result = await importAudienceMembers(
    cohort.organizationId,
    {
      recipients: [{ email }],
      cohortIds: [cohortId],
      sendEmail: true,
      allCourses: false,
      allCohorts: false
    },
    invitedByProfileId,
    'dashboard',
    { reissue: 'always', inviteSource: 'COHORT_RESEND' }
  );
  const [row] = result.rows;
  const status = row?.status ?? 'invalid_email';
  const refusal = COHORT_RESEND_REFUSALS[status];
  if (refusal) throw refusal();

  return { email: row?.email ?? email, status, inviteId: row?.inviteId ?? null };
}

/**
 * Removes this cohort from `email`'s organization invite; the invite is revoked only when nothing else is on it.
 */
export async function revokeCohortInvite(cohortId: string, email: string, revokedByProfileId: string) {
  const cohort = await getCohortOrThrow(cohortId);

  return revokeAudienceInviteAccess(cohort.organizationId, { email, cohortId }, revokedByProfileId);
}
