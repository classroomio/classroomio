import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCohortById } from '@cio/db/queries/cohort';
import type { TInviteStudentsToCohort, TAssignExistingStudentsToCohort } from '@cio/utils/validation/cohort';
import { assignAudienceToCourses, importAudienceMembers } from '@api/services/organization/audience';

/**
 * Invite students to a single program by email CSV.
 *
 * Thin wrapper that hardcodes `cohortIds = [cohortId]` and delegates to
 * `importAudienceMembers`. Lets a Cohort ADMIN/TUTOR (or org admin) issue org
 * invites scoped to *their own* program, without granting org-wide invite rights.
 */
export async function inviteStudentsToCohort(
  cohortId: string,
  data: TInviteStudentsToCohort,
  invitedByProfileId: string
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
    invitedByProfileId
  );
}

/**
 * Assign existing student profiles (already members of the org audience) to a
 * single program. Same scoping logic as `inviteStudentsToCohort` — restricted
 * to one program at a time so the caller's program-admin permission is enough.
 */
export async function assignExistingStudentsToCohort(cohortId: string, data: TAssignExistingStudentsToCohort) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) {
    throw new AppError('Cohort not found', ErrorCodes.COHORT_NOT_FOUND, 404);
  }

  return assignAudienceToCourses(cohort.organizationId, {
    profileIds: data.profileIds,
    cohortIds: [cohortId],
    sendEmail: data.sendEmail
  });
}
