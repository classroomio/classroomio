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
  ensureLearningPathCourseGrants,
  listLearningPathCourses,
  listLearningPathMembers,
  removeMember,
  revokeLearningPathGrants,
  updateMemberRole
} from '@cio/db/queries/learning-path';
import {
  createOrganizationInviteAudits,
  createOrganizationMembers,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  getOrgMembersByProfileIds
} from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import type { TAddLearningPathMembersInput, TPathMembersQuery } from '@cio/utils/validation/learning-path';
import { LEARNING_PATH_BULK_SYNC_MAX } from '@cio/utils/validation/learning-path';
import type { TListMembersResult } from '@cio/db/queries/learning-path';
import type { TLearningPathMember } from '@cio/db/types';
import { enqueuePathBulkEnroll, isRedisConfigured, waitForRedisReady } from '@cio/jobs';
import { PathBulkEnrollError, runQueuedPathBulkEnroll } from '@cio/core/services/learning-path/bulk-enroll';
import { enrollProfileCore } from '@cio/core/services/learning-path/enroll-profile-core';
import { getStaffInvitedEmails, supersedeStudentOrgInvites } from '@cio/core/services/organization/supersede-invites';
import { EMAIL_FANOUT_CONCURRENCY, mapWithConcurrency } from '@cio/core/services/learning-path/fanout';
import {
  buildPathInviteLink,
  getInviteExpiryLabel,
  normalizeInviteEmails
} from '@cio/core/services/learning-path/path-invite-utils';
import { resolveBulkMembers } from '@cio/core/services/learning-path/member-resolve';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { sendLearningPathInviteEmail, sendLearningPathWelcomeEmail } from './email';
import { scheduleLearningPathProgressSync } from './progress-sync-jobs';
import { throwAsInternal } from '@api/utils/errors';
import { assertStudentCapacityOrThrow, notifyStudentMilestone } from '@api/services/organization/student-limit';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';

/** Rejects tutor-role assigns from anyone but an org admin. */
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
 * and always grants the path's courses to STUDENT members.
 * Shared by manual adds, audience bulk imports and invite acceptance so every
 * front creates exactly the same rows.
 *
 * Also ensures org membership (with student quota) for STUDENT enrollments and
 * skips creating a STUDENT org row when the profile already holds a team role
 * (ADMIN/TUTOR) anywhere.
 */
export async function enrollProfileInLearningPath(
  path: { id: string; sequentialUnlock: boolean; organizationId: string },
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
 * The invite metadata carries `pathIds` so acceptance grants via
 * `enrollOrganizationInviteUser`. Returns the emails that got an invite, and
 * the emails skipped because an active staff invite already covers them.
 */
async function inviteEmailsWithoutProfilesToPath(
  organizationId: string,
  pathId: string,
  pathName: string,
  emails: string[],
  invitedByProfileId: string,
  options: { sendEmail?: boolean } = {}
): Promise<{ invited: string[]; skippedStaffInviteEmails: string[] }> {
  if (emails.length === 0) {
    return { invited: [], skippedStaffInviteEmails: [] };
  }

  const normalizedEmails = normalizeInviteEmails(emails);

  if (normalizedEmails.length === 0) {
    return { invited: [], skippedStaffInviteEmails: [] };
  }

  const organization = await getOrganizationById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const existingMembers = await getOrganizationMembersByNormalizedEmails(organizationId, normalizedEmails);
  const existingEmails = new Set(existingMembers.map((member) => member.normalizedEmail));

  const emailsToInvite = normalizedEmails;

  // Seat check, member rows and invites commit together, so a failure cannot
  // leave member rows without an invite. Earlier pending invites are folded
  // into the new one instead of wiped: the merged invite carries every live
  // resource id plus this path.
  const committed = await db.transaction(async (tx) => {
    let milestone: Awaited<ReturnType<typeof assertStudentCapacityOrThrow>> = null;

    // The supersede below skips staff-invited emails, so leave them out of the
    // member rows and the seat count: a STUDENT row written for them would
    // commit without an invite and take a seat.
    const staffInvitedEmails = await getStaffInvitedEmails(tx, { orgId: organizationId, emails: emailsToInvite });
    const newEmails = emailsToInvite.filter((email) => !existingEmails.has(email) && !staffInvitedEmails.has(email));

    if (newEmails.length > 0) {
      milestone = await assertStudentCapacityOrThrow(organizationId, newEmails.length, tx, {
        deferNotification: true
      });

      await createOrganizationMembers(
        newEmails.map((email) => ({
          organizationId,
          email,
          roleId: ROLE.STUDENT,
          verified: false
        })),
        tx
      );
    }

    const inviteBatch = await supersedeStudentOrgInvites(tx, {
      orgId: organizationId,
      emails: emailsToInvite,
      actorProfileId: invitedByProfileId,
      source: 'LEARNING_PATH_MANUAL_ADD',
      add: { courseIds: [], cohortIds: [], pathIds: [pathId] }
    });

    return { milestone, ...inviteBatch };
  });

  if (committed.milestone) {
    notifyStudentMilestone(committed.milestone).catch((error) => {
      console.error('notifyStudentMilestone error:', error);
    });
  }

  const createdInvites = committed.invites;

  const inviteByEmail = new Map(createdInvites.map((invite) => [invite.email, invite]));

  const sendEmail = options.sendEmail ?? true;

  await mapWithConcurrency(emailsToInvite, EMAIL_FANOUT_CONCURRENCY, async (email) => {
    const invite = inviteByEmail.get(email);

    // Staff-skipped emails have no new invite row.
    if (!invite) {
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
        inviteLink: buildPathInviteLink(invite.token, organization),
        expiresAt: getInviteExpiryLabel(invite.expiresAt),
        idempotencyKey: `learning-path-manual-invite:${invite.inviteId}`
      });

      await createOrganizationInviteAudits([
        {
          inviteId: invite.inviteId,
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

  return {
    invited: createdInvites.map((invite) => invite.email),
    skippedStaffInviteEmails: committed.skipped.map((entry) => entry.email)
  };
}

/**
 * Counts the STUDENT entries in a batch that would take a new seat: profiles
 * that are not yet org members, and emails with no org member row and no
 * active staff invite.
 */
async function countNewStudentsInBatch(
  organizationId: string,
  members: TAddLearningPathMembersInput['members']
): Promise<number> {
  const students = members.filter((member) => member.roleId === ROLE.STUDENT);
  const profileIds = [...new Set(students.map((member) => member.profileId).filter((id): id is string => !!id))];
  const emails = normalizeInviteEmails(
    students.filter((member) => !member.profileId && member.email).map((member) => member.email!)
  );

  const [profileMembers, emailMembers, staffInvitedEmails] = await Promise.all([
    profileIds.length > 0 ? getOrgMembersByProfileIds(organizationId, profileIds) : Promise.resolve([]),
    emails.length > 0 ? getOrganizationMembersByNormalizedEmails(organizationId, emails) : Promise.resolve([]),
    emails.length > 0
      ? db.transaction((tx) => getStaffInvitedEmails(tx, { orgId: organizationId, emails }))
      : Promise.resolve(new Set<string>())
  ]);
  const existingProfileIds = new Set(profileMembers.map((member) => member.profileId));
  const existingEmails = new Set(emailMembers.map((member) => member.normalizedEmail));

  const newProfiles = profileIds.filter((profileId) => !existingProfileIds.has(profileId)).length;
  // Staff-invited emails are skipped by the add, so they never take a seat.
  const newEmails = emails.filter((email) => !existingEmails.has(email) && !staffInvitedEmails.has(email)).length;

  return newProfiles + newEmails;
}

export type TAddPathMembersResult =
  | {
      mode: 'completed';
      members: TLearningPathMember[];
      requested: number;
      enrolled?: number;
      invited?: number;
      failed?: Array<{ email?: string; profileId?: string; reason: string }>;
      /** Emails left alone because an active staff (ADMIN/TUTOR) invite already covers them. */
      skippedStaffInviteEmails?: string[];
    }
  | { mode: 'queued'; jobId: string; requested: number };

/**
 * Adds one or more members to a learning path, initializes progress cache,
 * and always grants them the path's courses when they join as STUDENT.
 *
 * Entries with a `profileId` enroll immediately. Entries with only an `email`
 * resolve to an existing profile when one exists; otherwise an organization
 * invite targeting the path is issued so the learner joins on acceptance
 * (learning_path_member.profile_id is NOT NULL, so no pending path rows).
 *
 * Adds above `LEARNING_PATH_BULK_SYNC_MAX` run on the queue instead: auth is
 * verified here, then the worker applies the same batch mechanics in chunks.
 * Without Redis (or when enqueueing throws) the bulk add runs inline and
 * returns `completed`.
 */
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
    const bulkPayload = {
      organizationId: path.organizationId,
      actorProfileId: userId,
      pathId: path.id,
      enqueuedAt: new Date().toISOString(),
      members: payload.members.map((member) => ({
        profileId: member.profileId,
        email: member.email,
        roleId: member.roleId
      })),
      chunkSize: LEARNING_PATH_BULK_SYNC_MAX,
      sendEmail: payload.sendEmail ?? true
    };

    // Check room for the whole batch before queueing or running inline, so an
    // over-limit add fails up front. The milestone email is left to the run,
    // which sends it once students have actually joined.
    const newStudentCount = await countNewStudentsInBatch(path.organizationId, payload.members);
    await assertStudentCapacityOrThrow(path.organizationId, newStudentCount, db, { deferNotification: true });

    const redisConfigured = isRedisConfigured();
    let redisReady = false;

    if (redisConfigured) {
      try {
        redisReady = await waitForRedisReady();
      } catch {
        redisReady = false;
      }
    }

    // No Redis, or Redis not ready yet: run inline. The shared connection
    // buffers commands while offline again, so waitForRedisReady gates only
    // whether we attempt the queue at all.
    if (redisConfigured && redisReady) {
      const ENQUEUE_TIMEOUT_MS = 5000;
      let enqueueTimedOut = false;
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          enqueueTimedOut = true;
          reject(new AppError('Bulk enrollment could not be queued, try again', ErrorCodes.INTERNAL_ERROR, 503));
        }, ENQUEUE_TIMEOUT_MS);
      });

      try {
        const jobId = await Promise.race([enqueuePathBulkEnroll(bulkPayload), timeoutPromise]);

        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        if (jobId) {
          return { mode: 'queued', jobId, requested: payload.members.length };
        }

        console.warn('enqueuePathBulkEnroll returned no job id, running bulk enrollment inline', {
          pathId: path.id
        });
      } catch (error) {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }

        // Timed out: the job may still arrive, so never run inline.
        if (enqueueTimedOut || (error instanceof AppError && error.statusCode === 503)) {
          throw error instanceof AppError
            ? error
            : new AppError('Bulk enrollment could not be queued, try again', ErrorCodes.INTERNAL_ERROR, 503);
        }

        // Failed immediately (nothing was sent to Redis): run inline.
        console.warn('enqueuePathBulkEnroll failed, running bulk enrollment inline', {
          pathId: path.id,
          error
        });
      }
    }

    try {
      const outcome = await runQueuedPathBulkEnroll(bulkPayload);

      return {
        mode: 'completed',
        members: [],
        requested: outcome.requested,
        enrolled: outcome.enrolled,
        invited: outcome.invited,
        failed: outcome.failed
      };
    } catch (error) {
      // Same semantics as the sync path: a missing path is 404, the student
      // limit is 403 UPGRADE_REQUIRED (see assertStudentCapacityOrThrow).
      if (error instanceof PathBulkEnrollError) {
        if (error.code === 'PATH_NOT_FOUND') {
          throw new AppError(error.message, ErrorCodes.NOT_FOUND, 404);
        }

        throw new AppError(error.message, ErrorCodes.UPGRADE_REQUIRED, 403);
      }
      throw error;
    }
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

  const inviteOutcome = await inviteEmailsWithoutProfilesToPath(
    path.organizationId,
    path.id,
    path.name,
    inviteEmails,
    userId,
    { sendEmail: payload.sendEmail ?? true }
  );

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

  return {
    mode: 'completed',
    members: enrolledMembers,
    requested: payload.members.length,
    enrolled: enrolledMembers.length,
    invited: inviteOutcome.invited.length,
    failed: [],
    skippedStaffInviteEmails: inviteOutcome.skippedStaffInviteEmails
  };
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
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    if (roleId !== ROLE.STUDENT && roleId !== ROLE.TUTOR) {
      throw new AppError('Only STUDENT or TUTOR roles can be assigned', ErrorCodes.UNAUTHORIZED, 403);
    }

    const member = await getMemberById(memberId);

    if (!member || member.learningPathId !== path.id || member.removedAt) {
      throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
    }

    if (member.roleId !== ROLE.STUDENT && member.roleId !== ROLE.TUTOR) {
      throw new AppError('Only STUDENT or TUTOR roles can be changed', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (member.roleId === roleId) {
      return member;
    }

    const touchesTutorRole = member.roleId === ROLE.TUTOR || roleId === ROLE.TUTOR;

    if (touchesTutorRole && orgRoles?.[path.organizationId] !== ROLE.ADMIN) {
      throw new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403);
    }

    const updated = await db.transaction(async (tx) => {
      // Only applies while the role is still the one the checks above were
      // decided on, so grants are never written from a stale role.
      const next = await updateMemberRole(memberId, roleId, tx, path.id, member.roleId);

      if (!next) {
        const current = await getMemberById(memberId, tx);
        const stillActive = current && current.learningPathId === path.id && !current.removedAt;

        if (!stillActive) {
          throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
        }

        throw new AppError(
          "This member's role changed while you were editing. Refresh and try again.",
          ErrorCodes.CONFLICT,
          409
        );
      }

      if (member.roleId === ROLE.STUDENT && roleId !== ROLE.STUDENT && next.profileId) {
        await revokeLearningPathGrants(path.id, next.profileId, tx);
      }

      if (member.roleId !== ROLE.STUDENT && roleId === ROLE.STUDENT && next.profileId) {
        const courses = await listLearningPathCourses(path.id, tx);
        const courseIds = courses.map((course) => course.courseId);
        await ensureLearningPathCourseGrants(path.id, next.profileId, userId, tx, courseIds);
      }

      return next;
    });

    if (member.roleId === ROLE.STUDENT || roleId === ROLE.STUDENT) {
      void invalidateOrgStats(path.organizationId).catch(() => {});
    }

    return updated;
  } catch (error) {
    throwAsInternal(error, 'Failed to update learning path member role');
  }
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
