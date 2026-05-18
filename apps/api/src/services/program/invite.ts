import { AppError, ErrorCodes } from '@api/utils/errors';
import { getProgramById } from '@cio/db/queries/program';
import type { TInviteStudentsToProgram, TAssignExistingStudentsToProgram } from '@cio/utils/validation/program';
import { assignAudienceToCourses, importAudienceMembers } from '@api/services/organization/audience';

/**
 * Invite students to a single program by email CSV.
 *
 * Thin wrapper that hardcodes `programIds = [programId]` and delegates to
 * `importAudienceMembers`. Lets a Program ADMIN/TUTOR (or org admin) issue org
 * invites scoped to *their own* program, without granting org-wide invite rights.
 */
export async function inviteStudentsToProgram(
  programId: string,
  data: TInviteStudentsToProgram,
  invitedByProfileId: string
) {
  const program = await getProgramById(programId);
  if (!program) {
    throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
  }

  return importAudienceMembers(
    program.organizationId,
    {
      recipientCsv: data.recipientCsv,
      programIds: [programId],
      sendEmail: data.sendEmail,
      allCourses: false,
      allPrograms: false
    },
    invitedByProfileId
  );
}

/**
 * Assign existing student profiles (already members of the org audience) to a
 * single program. Same scoping logic as `inviteStudentsToProgram` — restricted
 * to one program at a time so the caller's program-admin permission is enough.
 */
export async function assignExistingStudentsToProgram(programId: string, data: TAssignExistingStudentsToProgram) {
  const program = await getProgramById(programId);
  if (!program) {
    throw new AppError('Program not found', ErrorCodes.PROGRAM_NOT_FOUND, 404);
  }

  return assignAudienceToCourses(program.organizationId, {
    profileIds: data.profileIds,
    programIds: [programId],
    sendEmail: data.sendEmail
  });
}
