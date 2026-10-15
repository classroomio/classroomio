import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { getCourseIdsInPath, getMemberByPathAndProfile } from '@cio/db/queries/learning-path';
import { getOrganizationById, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import type { TLearningPathMember } from '@cio/db/types';

import { resolveLearningPath } from './learning-path';
import { enrollProfileInLearningPath } from './member-management';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { sendLearningPathWelcomeEmail } from './email';
import { scheduleLearningPathProgressSync } from './progress-sync-jobs';
import { trackServerEvent, SERVER_EVENTS } from '@cio/analytics';

/**
 * Enrolls a student into a learning path and grants them course access for its courses.
 * Wraps member creation, course group membership, and enrollment grant records in a single transaction.
 * Idempotent on repeated calls.
 */
export async function enrollInLearningPath(pathId: string, profileId: string): Promise<TLearningPathMember> {
  const { member, path, organization, isFreshJoin, email } = await db.transaction(async (transactionClient) => {
    const path = await resolveLearningPath(pathId, transactionClient);

    if (!path.isPublished) {
      throw new AppError('Learning path is not published', ErrorCodes.PATH_NOT_PUBLISHED, 400);
    }

    if (!path.selfEnrollment) {
      throw new AppError('Self-enrollment is disabled for this learning path', ErrorCodes.FORBIDDEN, 403);
    }

    if (path.cost > 0) {
      throw new AppError('Paid learning paths require an invite or payment', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Enforce organization-level enrollment safeguards
    const organization = await getOrganizationById(path.organizationId, transactionClient);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const isInternalOnly = organization.settings?.internalEnrollmentOnly ?? false;
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, profileId, transactionClient);

    if (isInternalOnly && !orgMemberId) {
      throw new AppError(
        'This organization only allows its members to enroll. Ask an admin for an invitation.',
        ErrorCodes.FORBIDDEN,
        403
      );
    }

    const existingMember = await getMemberByPathAndProfile(path.id, profileId, transactionClient);
    const isFreshJoin = !existingMember;

    const member = await enrollProfileInLearningPath(path, { profileId, roleId: ROLE.STUDENT }, transactionClient);

    const studentProfile = await getProfileById(profileId);
    const studentEmail = studentProfile?.email ?? null;

    return { member, path, organization, isFreshJoin, email: studentEmail };
  });

  // Compliance courses track enrollment records for due dates and renewals.
  // Runs post-commit, and the helper skips
  // non-compliance courses, missing memberships, and existing records itself.
  if (isFreshJoin) {
    const pathCourseIds = await getCourseIdsInPath(path.id);
    await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, [profileId]);
  }

  if (isFreshJoin && email) {
    await sendLearningPathWelcomeEmail({
      organization,
      learningPath: path,
      profileId,
      email,
      idempotencyKey: `self-enroll-learning-path-welcome:${path.id}:${profileId}`
    });
  }

  if (isFreshJoin) {
    trackServerEvent({
      eventType: SERVER_EVENTS.ENROLLMENT_COMPLETED,
      orgId: path.organizationId,
      userId: profileId,
      props: { path: 'learning-path', learningPathId: path.id, source: 'self-enroll' }
    });
  }

  // Work the learner already did in these courses counts, so a path they have
  // effectively finished completes (and issues its certificate) right away.
  scheduleLearningPathProgressSync({ pathId: path.id, profileIds: [profileId] });

  return member;
}
