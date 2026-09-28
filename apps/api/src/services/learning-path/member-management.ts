import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  enrollMember,
  getCourseIdsInPath,
  getMemberById,
  getMemberByPathAndProfile,
  getPathAnalyticsStudents,
  getPathAnalyticsSummary,
  getPathCourseFunnelWithDropoff,
  getPathMemberDetail,
  getStuckItems,
  grantCourseAccess,
  initializeMemberCourseProgress,
  listLearningPathCourses,
  listLearningPathMembers,
  removeMember,
  revokeLearningPathGrants,
  updateMemberRole
} from '@cio/db/queries/learning-path';
import { getCourseGroupIds } from '@cio/db/queries/course/course';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import {
  createOrganizationInviteAudits,
  createOrganizationInvites,
  createOrganizationMember,
  createOrganizationMembers,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMembersByNormalizedEmails,
  getUserOrgRolesMap,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { getProfileById, getProfilesByEmails } from '@cio/db/queries/auth';
import type { TAddLearningPathMembers, TPathMembersQuery } from '@cio/utils/validation/learning-path';
import { LEARNING_PATH_BULK_SYNC_MAX } from '@cio/utils/validation/learning-path';
import type { TListMembersResult } from '@cio/db/queries/learning-path';
import type { TLearningPathMember } from '@cio/db/types';
import { enqueuePathBulkEnroll } from '@cio/jobs';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { sendLearningPathInviteEmail, sendLearningPathWelcomeEmail } from './email';
import { throwAsInternal } from '@api/utils/errors';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import crypto from 'node:crypto';

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
 * (ADMIN/TUTOR) anywhere — mirroring the self-hosted invariant in
 * services/account/profile.ts.
 */
export async function enrollProfileInLearningPath(
  path: { id: string; autoEnroll: boolean; sequentialUnlock: boolean; organizationId: string },
  input: { profileId: string; email?: string | null; roleId: number; grantedByProfileId?: string },
  dbClient: DbOrTxClient = db
) {
  const run = async (tx: DbOrTxClient) => {
    if (input.roleId === ROLE.STUDENT) {
      const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, input.profileId, tx);

      if (!orgMemberId) {
        const orgRoles = await getUserOrgRolesMap(input.profileId);
        const isTeamMember = Object.values(orgRoles).some((roleId) => roleId === ROLE.ADMIN || roleId === ROLE.TUTOR);

        if (!isTeamMember) {
          await assertStudentCapacityOrThrow(path.organizationId, 1, tx);
          await createOrganizationMember(
            {
              organizationId: path.organizationId,
              roleId: ROLE.STUDENT,
              profileId: input.profileId,
              verified: true
            },
            tx
          );
        }
      }
    }

    const member = await enrollMember(
      {
        learningPathId: path.id,
        profileId: input.profileId,
        email: input.email ?? null,
        roleId: input.roleId,
        status: 'NOT_STARTED'
      },
      tx
    );

    const courses = await listLearningPathCourses(path.id, tx);

    await initializeMemberCourseProgress(
      member.id,
      courses.map((course) => ({ id: course.id, order: course.order })),
      path.sequentialUnlock,
      tx
    );

    if (path.autoEnroll) {
      const courseIds = courses.map((course) => course.courseId);
      await ensureLearningPathCourseGrants(path.id, input.profileId, input.grantedByProfileId, tx, courseIds);
    }

    return member;
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

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildPathInviteLink(token: string, organization: { siteName?: string | null }): string {
  return `${getDashboardBaseUrl(organization)}/invite/${encodeURIComponent(token)}`;
}

function getInviteExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
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
  invitedByProfileId: string
): Promise<string[]> {
  if (emails.length === 0) {
    return [];
  }

  const normalizedEmails = [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];

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

  for (const email of emailsToInvite) {
    const invite = inviteByEmail.get(email);
    const token = rawTokenByEmail.get(email);

    if (!invite || !token) {
      continue;
    }

    const inviteSent = await sendLearningPathInviteEmail({
      organization,
      learningPath: { id: pathId, name: pathName },
      email,
      inviteLink: buildPathInviteLink(token, organization),
      expiresAt: getInviteExpiryLabel(expiresAt),
      idempotencyKey: `learning-path-manual-invite:${invite.id}`
    });

    if (inviteSent) {
      await createOrganizationInviteAudits([
        {
          inviteId: invite.id,
          organizationId,
          eventType: 'EMAIL_SENT' as const,
          actorProfileId: invitedByProfileId,
          targetEmail: email,
          ipAddress: null,
          userAgent: null,
          metadata: {}
        }
      ]);
    } else {
      await createOrganizationInviteAudits([
        {
          inviteId: invite.id,
          organizationId,
          eventType: 'EMAIL_FAILED' as const,
          actorProfileId: invitedByProfileId,
          targetEmail: email,
          ipAddress: null,
          userAgent: null,
          metadata: { error: 'enqueue failed' }
        }
      ]);
    }
  }

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
  payload: TAddLearningPathMembers,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TAddPathMembersResult> {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  const hasTutorRole = payload.members.some((member) => member.roleId === ROLE.TUTOR);
  if (hasTutorRole && orgRoles?.[path.organizationId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403);
  }

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
      chunkSize: LEARNING_PATH_BULK_SYNC_MAX
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

  const emailOnlyEmails = emailOnlyEntries.map((entry) => entry.email!.toLowerCase().trim());
  const profilesByEmail = new Map<string, { id: string }>();

  if (emailOnlyEmails.length > 0) {
    const profiles = await getProfilesByEmails(emailOnlyEmails);

    for (const profile of profiles) {
      if (profile.email) {
        profilesByEmail.set(profile.email.toLowerCase().trim(), { id: profile.id });
      }
    }
  }

  type TResolvedMemberInput = { profileId: string; email: string | null; roleId: number };
  const directEnrollments: TResolvedMemberInput[] = [];
  const inviteEmails: string[] = [];

  for (const memberInput of payload.members) {
    if (memberInput.profileId) {
      directEnrollments.push({
        profileId: memberInput.profileId,
        email: memberInput.email ?? null,
        roleId: memberInput.roleId
      });
      continue;
    }

    const normalizedEmail = memberInput.email!.toLowerCase().trim();
    const existingProfile = profilesByEmail.get(normalizedEmail);

    if (existingProfile) {
      directEnrollments.push({
        profileId: existingProfile.id,
        email: memberInput.email ?? null,
        roleId: memberInput.roleId
      });
    } else {
      inviteEmails.push(normalizedEmail);
    }
  }

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
  // Mirrors course team-add: runs post-commit for every added student; the
  // helper no-ops for non-compliance courses and existing records.
  const addedStudentProfileIds = directEnrollments
    .filter((memberInput) => memberInput.roleId === ROLE.STUDENT)
    .map((memberInput) => memberInput.profileId);

  if (addedStudentProfileIds.length > 0) {
    const pathCourseIds = await getCourseIdsInPath(path.id);
    await ensureComplianceEnrollmentRecordsForProfiles(pathCourseIds, addedStudentProfileIds);
  }

  if (inviteEmails.length > 0) {
    await inviteEmailsWithoutProfilesToPath(path.organizationId, path.id, path.name, inviteEmails, userId);
  }

  if (welcomeCandidates.length > 0) {
    const organization = await getOrganizationById(path.organizationId);

    if (organization) {
      for (const candidate of welcomeCandidates) {
        let recipientEmail = candidate.email;

        if (!recipientEmail) {
          const profile = await getProfileById(candidate.profileId);
          recipientEmail = profile?.email ?? null;
        }

        if (recipientEmail) {
          await sendLearningPathWelcomeEmail({
            organization,
            learningPath: path,
            profileId: candidate.profileId,
            email: recipientEmail,
            idempotencyKey: `learning-path-members-welcome:${path.id}:${candidate.profileId}`
          });
        }
      }
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

/**
 * Ensures LEARNING_PATH course grants for a profile across the path's courses.
 * Enrolls the profile into each course's default student group.
 */
export async function ensureLearningPathCourseGrants(
  pathId: string,
  profileId: string,
  grantedByProfileId: string | undefined,
  dbClient: DbOrTxClient,
  courseIds: string[]
): Promise<void> {
  if (courseIds.length === 0) {
    return;
  }

  const courseGroups = await getCourseGroupIds(courseIds, dbClient);

  if (courseGroups.length === 0) {
    return;
  }

  const groupMemberValues = courseGroups
    .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
    .map((entry) => ({
      groupId: entry.groupId,
      profileId,
      roleId: ROLE.STUDENT
    }));

  await insertGroupMembersOnConflictDoNothing(groupMemberValues, dbClient);

  for (const entry of courseGroups) {
    if (!entry.groupId) {
      continue;
    }

    const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, profileId, dbClient);

    if (groupMemberId) {
      await grantCourseAccess(
        {
          groupmemberId: groupMemberId,
          courseId: entry.courseId,
          profileId,
          source: 'LEARNING_PATH',
          learningPathId: pathId,
          grantedByProfileId
        },
        dbClient
      );
    }
  }
}
