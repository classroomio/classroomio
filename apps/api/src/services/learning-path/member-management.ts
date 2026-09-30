import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getCourseIdsInPath,
  getMemberById,
  getMemberByPathAndProfile,
  getPathAnalyticsStudents,
  getPathAnalyticsSummary,
  getPathCourseFunnelWithDropoff,
  getPathMemberDetail,
  getStuckItems,
  listLearningPathMembers,
  removeMember,
  revokeLearningPathGrants,
  updateMemberRole
} from '@cio/db/queries/learning-path';
import {
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMembers,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import type { TAddLearningPathMembersInput, TPathMembersQuery } from '@cio/utils/validation/learning-path';
import { LEARNING_PATH_BULK_SYNC_MAX } from '@cio/utils/validation/learning-path';
import type { TListMembersResult } from '@cio/db/queries/learning-path';
import type { TLearningPathMember } from '@cio/db/types';
import { enqueuePathBulkEnroll } from '@cio/jobs';
import { enrollProfileCore } from '@cio/core/services/learning-path/enroll-profile-core';
import { EMAIL_FANOUT_CONCURRENCY, mapWithConcurrency } from '@cio/core/services/learning-path/fanout';
import {
  buildPathInviteLink,
  getInviteExpiryLabel,
  hashInviteToken,
  normalizeInviteEmails,
  ORG_INVITE_EXPIRY_MS
} from '@cio/core/services/learning-path/path-invite-utils';
import { resolveBulkMembers } from '@cio/core/services/learning-path/member-resolve';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { sendLearningPathInviteEmail, sendLearningPathWelcomeEmail } from './email';
import { scheduleLearningPathProgressSync } from './progress-sync-jobs';
import { throwAsInternal } from '@api/utils/errors';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import crypto from 'node:crypto';

function assertOnlyAdminsCanAssignTutors(
  members: Array<{ roleId: number }>,
  organizationId: string,
  orgRoles?: Record<string, number>
): void {
  const hasTutorRole = members.some((member) => member.roleId === ROLE.TUTOR);

  if (hasTutorRole && orgRoles?.[organizationId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403);
  }
}

/**
 * Lists active members in a learning path.
 */
export async function listPathMembersService(
  pathId: string,
  userId: string,
  orgRoles: Record<string, number> | undefined,
  options: TPathMembersQuery
): Promise<TListMembersResult> {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    return await listLearningPathMembers(path.id, options);
  } catch (error) {
    throwAsInternal(error, 'Failed to list learning path members');
  }
}

/**
 * Enrolls one profile into a learning path, initializes progress cache,
 * and auto-enrolls into the path's courses when autoEnroll is enabled.
 * Shared by manual adds, audience bulk imports and invite acceptance so every
 * front creates exactly the same rows.
 *
 * Also ensures org membership (with student quota) for STUDENT enrollments and
 * skips creating a STUDENT org row when the profile already holds a team role
 * (ADMIN/TUTOR) anywhere.
 */
export async function enrollProfileInLearningPath(
  path: { id: string; autoEnroll: boolean; sequentialUnlock: boolean; organizationId: string },
  input: { profileId: string; email?: string | null; roleId: number; grantedByProfileId?: string },
  dbClient: DbOrTxClient = db
) {
  const run = async (tx: DbOrTxClient) => {
    return enrollProfileCore(path, input, tx, assertStudentCapacityOrThrow);
  };

  try {
    if (dbClient !== db) {
      return await run(dbClient);
    }

    const member = await db.transaction(run);

    void invalidateOrgStats(path.organizationId).catch(() => {});

    return member;
  } catch (error) {
    throwAsInternal(error, 'Failed to enroll profile in learning path');
  }
}

/**
 * Creates org invites targeting a learning path for emails without an account.
 * The invite metadata carries `pathIds` so acceptance auto-enrolls via
 * `enrollOrganizationInviteUser`. Returns the normalized emails that were invited.
 */
async function inviteEmailsWithoutProfilesToPath(
  organizationId: string,
  pathId: string,
  pathName: string,
  emails: string[],
  invitedByProfileId: string,
  options: { sendEmail?: boolean } = {}
): Promise<string[]> {
  if (emails.length === 0) {
    return [];
  }

  const normalizedEmails = normalizeInviteEmails(emails);

  if (normalizedEmails.length === 0) {
    return [];
  }

  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const existingMembers = await getOrganizationMembersByNormalizedEmails(organizationId, normalizedEmails);
  const existingEmails = new Set(existingMembers.map((member) => member.normalizedEmail));
  const newEmails = normalizedEmails.filter((email) => !existingEmails.has(email));

  const emailsToInvite = normalizedEmails;

  if (newEmails.length > 0) {
    await assertStudentCapacityOrThrow(organizationId, newEmails.length);

    await createOrganizationMembers(
      newEmails.map((email) => ({
        organizationId,
        email,
        roleId: ROLE.STUDENT,
        verified: false
      }))
    );
  }

  await revokeActiveOrganizationInvitesByEmails(organizationId, emailsToInvite, invitedByProfileId);

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const tokenPairs = emailsToInvite.map((email) => ({
    email,
    token: crypto.randomBytes(32).toString('base64url')
  }));

  const inviteRows = tokenPairs.map(({ email, token }) => ({
    organizationId,
    roleId: ROLE.STUDENT,
    email,
    tokenHash: hashInviteToken(token),
    createdByProfileId: invitedByProfileId,
    expiresAt,
    isRevoked: false,
    metadata: {
      source: 'LEARNING_PATH_MANUAL_ADD',
      pathIds: [pathId]
    }
  }));

  const createdInvites = await createOrganizationInvites(inviteRows);
  const inviteByEmail = new Map(createdInvites.map((invite) => [(invite.email ?? '').toLowerCase(), invite]));
  const rawTokenByEmail = new Map(tokenPairs.map((pair) => [pair.email, pair.token]));

  await createOrganizationInviteAudits(
    createdInvites.map((invite) => ({
      inviteId: invite.id,
      organizationId,
      eventType: 'CREATED' as const,
      actorProfileId: invitedByProfileId,
      targetEmail: invite.email,
      ipAddress: null,
      userAgent: null,
      metadata: {
        roleId: ROLE.STUDENT,
        roleName: 'Student',
        expiresAt,
        pathIds: [pathId]
      }
    }))
  );

  const sendEmail = options.sendEmail ?? true;

  await mapWithConcurrency(emailsToInvite, EMAIL_FANOUT_CONCURRENCY, async (email) => {
    const invite = inviteByEmail.get(email);
    const token = rawTokenByEmail.get(email);

    if (!invite || !token) {
      return;
    }

    // Invites and CREATED audits above are membership plumbing and always
    // written; only the send respects the toggle, mirroring course assigns.
    if (!sendEmail) {
      return;
    }

    try {
      const inviteSent = await sendLearningPathInviteEmail({
        organization,
        learningPath: { id: pathId, name: pathName },
        email,
        inviteLink: buildPathInviteLink(token, organization),
        expiresAt: getInviteExpiryLabel(expiresAt),
        idempotencyKey: `learning-path-manual-invite:${invite.id}`
      });

      await createOrganizationInviteAudits([
        {
          inviteId: invite.id,
          organizationId,
          eventType: inviteSent ? ('EMAIL_SENT' as const) : ('EMAIL_FAILED' as const),
          actorProfileId: invitedByProfileId,
          targetEmail: email,
          ipAddress: null,
          userAgent: null,
          metadata: inviteSent ? {} : { error: 'enqueue failed' }
        }
      ]);
    } catch (error) {
      console.error('inviteEmailsWithoutProfilesToPath email error', { pathId, email, error });
    }
  });

  return emailsToInvite;
}

/**
 * Adds one or more members to a learning path, initializes progress cache,
 * and auto-enrolls them in the path's courses if autoEnroll is enabled.
 *
 * Entries with a `profileId` enroll immediately. Entries with only an `email`
 * resolve to an existing profile when one exists; otherwise an organization
 * invite targeting the path is issued so the learner joins on acceptance
 * (learning_path_member.profile_id is NOT NULL, so no pending path rows).
 *
 * Adds above `LEARNING_PATH_BULK_SYNC_MAX` run on the queue instead: auth is
 * verified here, then the worker applies the same batch mechanics in chunks.
 */
export type TAddPathMembersResult = TLearningPathMember[] | { mode: 'queued'; jobId: string; requested: number };

export async function addPathMembersService(
  pathId: string,
  payload: TAddLearningPathMembersInput,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TAddPathMembersResult> {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);
  assertOnlyAdminsCanAssignTutors(payload.members, path.organizationId, orgRoles);

  if (payload.members.length > LEARNING_PATH_BULK_SYNC_MAX) {
    const jobId = await enqueuePathBulkEnroll({
      organizationId: path.organizationId,
      actorProfileId: userId,
      pathId: path.id,
      members: payload.members.map((member) => ({
        profileId: member.profileId,
        email: member.email,
        roleId: member.roleId
      })),
      chunkSize: LEARNING_PATH_BULK_SYNC_MAX,
      sendEmail: payload.sendEmail ?? true
    });

    if (!jobId) {
      throw new AppError('Could not queue this enrollment', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return { mode: 'queued', jobId, requested: payload.members.length };
  }

  const emailOnlyEntries = payload.members.filter((member) => !member.profileId);

  for (const entry of emailOnlyEntries) {
    if (!entry.email) {
      throw new AppError('Each member must provide a profileId or email', ErrorCodes.VALIDATION_ERROR, 400);
    }

    if (entry.roleId === ROLE.TUTOR) {
      throw new AppError(
        'Tutors must have an account before they can be added to a learning path',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }

  const resolved = await resolveBulkMembers(payload.members);

  if (resolved.failed.length > 0) {
    throw new AppError('Each member must provide a profileId or email', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const directEnrollments = resolved.direct;
  const inviteEmails = resolved.inviteEmails;

  const { enrolledMembers, welcomeCandidates } = await db.transaction(async (tx) => {
    const enrolledMembers = [];
    const welcomeCandidates: Array<{ profileId: string; email: string | null }> = [];

    for (const memberInput of directEnrollments) {
      const existingMember = await getMemberByPathAndProfile(path.id, memberInput.profileId, tx);
      const isFreshJoin = !existingMember;

      const member = await enrollProfileInLearningPath(
        path,
        {
          profileId: memberInput.profileId,
          email: memberInput.email ?? null,
          roleId: memberInput.roleId,
          grantedByProfileId: userId
        },
        tx
      );

      enrolledMembers.push(member);

      if (isFreshJoin && memberInput.roleId === ROLE.STUDENT) {
        welcomeCandidates.push({
          profileId: memberInput.profileId,
          email: memberInput.email ?? null
        });
      }
    }

    return { enrolledMembers, welcomeCandidates };
  });

  if (enrolledMembers.length > 0) {
    void invalidateOrgStats(path.organizationId).catch(() => {});
  }

  // Compliance courses track enrollment records for due dates and renewals.
  // The helper no-ops for non-compliance courses and existing records.
  const addedStudentProfileIds = directEnrollments
    .filter((memberInput) => memberInput.roleId === ROLE.STUDENT)
    .map((memberInput) => memberInput.profileId);

  if (addedStudentProfileIds.length > 0) {
    const pathCourseIds = await getCourseIdsInPath(path.id);
    await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, addedStudentProfileIds);

    // Prior work in these courses counts, so an effectively finished path completes now.
    scheduleLearningPathProgressSync({ pathId: path.id, profileIds: addedStudentProfileIds });
  }

  if (inviteEmails.length > 0) {
    await inviteEmailsWithoutProfilesToPath(path.organizationId, path.id, path.name, inviteEmails, userId, {
      sendEmail: payload.sendEmail ?? true
    });
  }

  if (payload.sendEmail !== false && welcomeCandidates.length > 0) {
    const organization = await getOrganizationById(path.organizationId);

    if (organization) {
      await mapWithConcurrency(welcomeCandidates, EMAIL_FANOUT_CONCURRENCY, async (candidate) => {
        try {
          let recipientEmail = candidate.email;

          if (!recipientEmail) {
            const profile = await getProfileById(candidate.profileId);
            recipientEmail = profile?.email ?? null;
          }

          if (!recipientEmail) {
            return;
          }

          await sendLearningPathWelcomeEmail({
            organization,
            learningPath: path,
            profileId: candidate.profileId,
            email: recipientEmail,
            idempotencyKey: `learning-path-members-welcome:${path.id}:${candidate.profileId}`
          });
        } catch (error) {
          console.error('addPathMembersService welcome email error', {
            pathId: path.id,
            profileId: candidate.profileId,
            error
          });
        }
      });
    }
  }

  return enrolledMembers;
}

/**
 * Changes a member's role between student and tutor. Only organization admins
 * can assign the tutor role, mirroring member adds. Student-role changes
 * refresh org stats since the enrolled-learner count moves.
 */
export async function updatePathMemberRoleService(
  pathId: string,
  memberId: string,
  roleId: number,
  userId: string,
  orgRoles?: Record<string, number>
) {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  if (roleId === ROLE.TUTOR && orgRoles?.[path.organizationId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403);
  }

  const member = await getMemberById(memberId);

  if (!member || member.learningPathId !== path.id) {
    throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
  }

  const updated = await updateMemberRole(memberId, roleId);

  if (!updated) {
    throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
  }

  if (member.roleId === ROLE.STUDENT || roleId === ROLE.STUDENT) {
    void invalidateOrgStats(path.organizationId).catch(() => {});
  }

  return updated;
}

/**
 * Returns a member with per-course progress rows in path order.
 */
export async function getPathMemberDetailService(
  pathId: string,
  personId: string,
  userId: string,
  orgRoles?: Record<string, number>
) {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const detail = await getPathMemberDetail(path.id, personId);

    if (!detail) {
      throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
    }

    return detail;
  } catch (error) {
    throwAsInternal(error, 'Failed to get learning path member detail');
  }
}

/**
 * Soft-removes a member from a learning path by setting removedAt,
 * and revokes all LEARNING_PATH grants. Preserves groupmember rows and progress.
 */
export async function removePathMemberService(
  pathId: string,
  memberId: string,
  userId: string,
  orgRoles?: Record<string, number>
) {
  try {
    return await db.transaction(async (tx) => {
      const path = await resolveLearningPath(pathId, tx);
      await assertCanManageLearningPath(path, userId, orgRoles, tx);

      const member = await getMemberById(memberId, tx);

      if (!member || member.learningPathId !== path.id) {
        throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
      }

      const removed = await removeMember(memberId, tx);

      if (member.profileId) {
        await revokeLearningPathGrants(path.id, member.profileId, tx);
      }

      return removed;
    });
  } catch (error) {
    throwAsInternal(error, 'Failed to remove learning path member');
  }
}

/**
 * Returns aggregated funnel metrics and per-course completion stats for a learning path.
 */
export async function getPathAnalyticsService(pathId: string, userId: string, orgRoles?: Record<string, number>) {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const [summary, funnel, stuckItems, students] = await Promise.all([
      getPathAnalyticsSummary(path.id),
      getPathCourseFunnelWithDropoff(path.id),
      getStuckItems(path.id),
      getPathAnalyticsStudents(path.id)
    ]);

    return {
      summary,
      funnel,
      stuckItems,
      students
    };
  } catch (error) {
    throwAsInternal(error, 'Failed to get learning path analytics');
  }
}
