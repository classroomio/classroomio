import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { isUniqueConstraintViolation } from '@cio/utils/errors';
import {
  addCourseMember,
  deleteCourseMember,
  getCourseGroupId,
  getCourseMember,
  getPaginatedCourseMembers,
  updateCourseMember
} from '@cio/db/queries/course/people';
import { getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { resetStudentCourseProgress } from '@cio/db/queries/course/reset-progress';

import type { TAddCourseMembers } from '@cio/utils/validation/course/people';
import type { TGroupmember } from '@cio/db/types';
import type { PaginatedCourseMember, PaginatedCourseMembersOptions } from '@cio/db/queries/course/people';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import {
  buildMemberSource,
  emitCourseMemberAddedWebhookEvent,
  emitCourseMemberRemovedWebhookEvent,
  emitCourseWebhookEvent,
  type TWebhookMemberSource
} from '@cio/core/services/webhook/emit';
import { getCourseProgress } from '@cio/db/queries/course/course';
import { getWebhookLastActiveAt } from '@cio/db/queries/webhook';
import { calcCourseProgressPercent } from '@api/utils/course-completion';
import { getCourseWithOrgData, getOrgIdByCourseId } from '@cio/db/queries/course';
import { revokeGrantsForGroupmember } from '@cio/db/queries/learning-path';
import { getProfileById } from '@cio/db/queries/auth';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { syncCourseProgressInLearningPaths } from '@api/services/learning-path';
import { ensureComplianceEnrollmentRecordsForProfiles } from './compliance';
import { recordDirectCourseGrant } from './enrollment-grants';
import { assertCourseAllowsDirectStudentAdd } from './path-gate';
import { getCourseMemberProgressSummaries } from './member-progress';
import { getWelcomeSessionIcs } from './session-invite';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnersEnrolled } from '@api/services/product-events';

/**
 * Returns the existing membership row when the profile is already in the
 * course group, so re-adds stay idempotent instead of violating the
 * `unique_entries` constraint. Email-only entries (no profileId) skip the
 * check and follow the insert path. Returns the row without its joined
 * profile/grant fields so the shape matches a freshly created member.
 */
async function getExistingCourseMember(
  courseId: string,
  courseGroupId: string | null,
  profileId: string | undefined,
  tx: DbOrTxClient
): Promise<TGroupmember | null> {
  if (!profileId || !courseGroupId) {
    return null;
  }

  const existingId = await getGroupMemberIdByGroupAndProfile(courseGroupId, profileId, tx);

  if (!existingId) {
    return null;
  }

  const existing = await getCourseMember(courseId, existingId);

  if (!existing) {
    return null;
  }

  const {
    profile: _profile,
    enrollmentSource: _source,
    enrollmentSourcePathPublicId: _sourcePathId,
    enrollmentSourceCohortId: _sourceCohortId,
    ...member
  } = existing;

  return member;
}

/**
 * Attaches only `stage` to a page of members.
 *
 * Progress, last login and enrollment date already come from the query, but
 * `stage` names a content item in canonical course order, which is derived in
 * application code rather than SQL.
 */
async function addMemberStages(courseId: string, members: PaginatedCourseMember[]) {
  const progressSummaries = await getCourseMemberProgressSummaries(
    courseId,
    members.map((member) => ({
      profileId: member.profileId ?? '',
      roleId: member.roleId,
      createdAt: member.createdAt ?? null
    }))
  );

  return members.map((member) => {
    if (!member.profileId || member.roleId !== ROLE.STUDENT) {
      return member;
    }

    const progress = progressSummaries.get(member.profileId);
    if (!progress) {
      return member;
    }

    return { ...member, stage: progress.stage };
  });
}

/**
 * Gets one filtered, sorted page of course members for a course.
 * @param courseId Course ID
 * @param query Page, page size, search term, filters and sort
 * @returns One page of course members with profile, progress and stage data, plus pagination totals
 */
export async function listPaginatedCourseMembers(courseId: string, query: PaginatedCourseMembersOptions) {
  try {
    const result = await getPaginatedCourseMembers(courseId, query);
    const items = await addMemberStages(courseId, result.items);

    return {
      ...result,
      items
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list paginated course members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Finds the profile's membership row or creates it, repairing the direct
 * student grant on either path so re-adds stay idempotent instead of
 * violating the `unique_entries` constraint.
 * @param courseId Course ID
 * @param courseGroupId Course group ID (null skips the existing-member lookup)
 * @param memberData Member data (profileId, roleId, email, name)
 * @param tx Transaction client owning the membership write and grant repair
 * @returns The member row and whether it was newly created
 */
async function findOrCreateCourseMemberWithGrant(
  courseId: string,
  courseGroupId: string | null,
  memberData: TAddCourseMembers[number],
  tx: DbOrTxClient
): Promise<{ member: TGroupmember; isNewMember: boolean }> {
  const existingMember = await getExistingCourseMember(courseId, courseGroupId, memberData.profileId, tx);

  if (existingMember) {
    if (memberData.roleId === ROLE.STUDENT) {
      const grantInput = {
        groupmemberId: existingMember.id,
        courseId,
        profileId: existingMember.profileId
      };
      await recordDirectCourseGrant(grantInput, { source: 'ADMIN_ADD' }, tx);
    }

    return { member: existingMember, isNewMember: false };
  }

  const createdMember = await addCourseMember(courseId, memberData, tx);

  if (memberData.roleId === ROLE.STUDENT) {
    const grantInput = { groupmemberId: createdMember.id, courseId, profileId: createdMember.profileId };
    await recordDirectCourseGrant(grantInput, { source: 'ADMIN_ADD' }, tx);
  }

  return { member: createdMember, isNewMember: true };
}

export type TMemberWebhookContext = { source?: TWebhookMemberSource; actorProfileId?: string | null };

async function findLastActiveAt(organizationId: string | null, profileId: string) {
  if (!organizationId) return null;

  return getWebhookLastActiveAt(organizationId, profileId);
}

async function readProgressAtRemoval(courseId: string, memberId: string) {
  try {
    const member = await getCourseMember(courseId, memberId);

    if (!member?.profileId || member.roleId !== ROLE.STUDENT) return null;

    const progress = await getCourseProgress(courseId, member.profileId);
    const percent = calcCourseProgressPercent({
      lessonsCompleted: progress.lessonsCompleted,
      totalLessons: progress.lessonsCount,
      exercisesCompleted: progress.exercisesCompleted,
      exercisesCount: progress.exercisesCount
    });

    const organizationId = await getOrgIdByCourseId(courseId);
    const lastActiveAt = await findLastActiveAt(organizationId, member.profileId);

    return { percent, completed: progress.completedAt !== null, lastActiveAt };
  } catch (error) {
    console.error('readProgressAtRemoval error:', error);

    return null;
  }
}

type TCourseOrgData = NonNullable<Awaited<ReturnType<typeof getCourseWithOrgData>>>;

/**
 * Uses the same idempotency key as Audience → Assign courses, so a student added both ways gets one email.
 */
async function sendStudentCourseWelcome(
  courseId: string,
  courseOrgData: TCourseOrgData,
  student: TAddCourseMembers[number],
  delivery: { baseUrl: string; branding: ReturnType<typeof buildEmailBranding>; ics?: string }
) {
  const to = student.profileId ? (await getProfileById(student.profileId))?.email : student.email;
  if (!to) return;

  const orgName = courseOrgData.orgName || 'ClassroomIO';
  const idempotencyKey = student.profileId
    ? `audience-course-welcome:${courseOrgData.groupId}:${student.profileId}`
    : `course-people-student-welcome:${courseId}:${to}`;

  await enqueueTransactionalEmail('studentCourseWelcome', {
    to,
    fields: {
      orgName,
      courseName: courseOrgData.courseTitle || 'Course',
      loginUrl: delivery.baseUrl,
      customMessage: courseOrgData.welcomeEmailMessage ?? undefined,
      branding: delivery.branding
    },
    from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
    idempotencyKey,
    ics: delivery.ics,
    preference: { organizationId: courseOrgData.orgId, recipientProfileId: student.profileId }
  });
}

/**
 * Adds multiple course members to a course and optionally sends welcome emails
 * @param courseId Course ID
 * @param members Array of member data
 * @returns Array of created members
 */
export async function addMembers(
  courseId: string,
  members: TAddCourseMembers,
  source: TEventSource = 'dashboard',
  context: TMemberWebhookContext = {},
  options: { sendEmail?: boolean } = {}
) {
  const { sendEmail = true } = options;

  try {
    if (members.length === 0) {
      throw new AppError('At least one member must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Validate all members
    for (const member of members) {
      if (!member.profileId && !member.email) {
        throw new AppError(
          'Either profileId or email must be provided for each member',
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }
    }

    // Get course title and organization data for emails (simple query, no expensive joins)
    const courseOrgData = await getCourseWithOrgData(courseId);

    if (!courseOrgData) {
      throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (members.some((member) => member.roleId === ROLE.STUDENT)) {
      await assertCourseAllowsDirectStudentAdd(courseId);
    }

    const courseName = courseOrgData.courseTitle || '';
    const orgName = courseOrgData.orgName || 'ClassroomIO';
    const orgSiteName = courseOrgData.orgSiteName || '';
    const branding = buildEmailBranding({
      name: courseOrgData.orgName,
      avatarUrl: courseOrgData.orgAvatarUrl,
      theme: courseOrgData.orgTheme
    });

    // Add members sequentially so partial failures still invalidate stats for successful inserts.
    // Already-enrolled profiles are skipped (grant repaired) so re-adding
    // from the invite modal can never violate `unique_entries`. The response
    // carries only newly created rows so counts stay truthful.
    const processed: Array<{ input: TAddCourseMembers[number]; member: TGroupmember; isNew: boolean }> = [];
    const addedMembers: TGroupmember[] = [];
    let addedStudentMember = false;
    const courseGroupId = await getCourseGroupId(courseId);

    try {
      for (const member of members) {
        const { member: addedMember, isNewMember } = await db.transaction(async (tx) => {
          return findOrCreateCourseMemberWithGrant(courseId, courseGroupId, member, tx);
        });

        processed.push({ input: member, member: addedMember, isNew: isNewMember });

        if (!isNewMember) {
          continue;
        }

        addedMembers.push(addedMember);
        await emitCourseMemberAddedWebhookEvent(courseId, addedMember, {
          source: context.source ?? buildMemberSource('admin'),
          actorProfileId: context.actorProfileId
        });

        if (member.roleId === ROLE.STUDENT) {
          addedStudentMember = true;
        }
      }
    } finally {
      if (addedStudentMember) {
        await invalidateOrgStats(courseOrgData.orgId);
      }

      captureLearnersEnrolled(addedMembers, 'admin', source);
    }

    const studentProfileIds = members
      .filter((member) => member.roleId === ROLE.STUDENT && member.profileId)
      .map((member) => member.profileId!);

    if (studentProfileIds.length > 0) {
      await ensureComplianceEnrollmentRecordsForProfiles([courseId], studentProfileIds);
    }

    if (!sendEmail) {
      return addedMembers;
    }

    const baseUrl = getDashboardBaseUrl({
      siteName: orgSiteName,
      customDomain: courseOrgData.orgCustomDomain,
      isCustomDomainVerified: courseOrgData.orgIsCustomDomainVerified
    });
    const inviteLink = `${baseUrl}/org/${orgSiteName}/courses`;

    const emailPromises: Promise<unknown>[] = [];
    const addedStudents = processed
      .filter((entry) => entry.isNew && entry.input.roleId === ROLE.STUDENT)
      .map((entry) => entry.input);
    const welcomeIcs = addedStudents.length > 0 ? await getWelcomeSessionIcs(courseId) : undefined;

    for (const student of addedStudents) {
      emailPromises.push(
        sendStudentCourseWelcome(courseId, courseOrgData, student, { baseUrl, branding, ics: welcomeIcs }).catch(
          (emailError) => {
            console.error('Failed to enqueue student welcome email:', emailError);
          }
        )
      );
    }

    for (const entry of processed) {
      if (!entry.isNew) {
        continue;
      }

      const roleId = entry.input.roleId;
      const email = entry.input.email;
      const name = entry.input.name;

      if ((roleId === ROLE.ADMIN || roleId === ROLE.TUTOR) && email && name) {
        emailPromises.push(
          enqueueTransactionalEmail('teacherCourseWelcome', {
            to: email,
            fields: {
              name,
              orgName,
              courseName,
              inviteLink,
              branding
            },
            from: buildEmailFromName(`${orgName} (via ClassroomIO.com)`),
            idempotencyKey: `teacher-course-welcome:${courseId}:${email}`,
            preference: { organizationId: courseOrgData.orgId }
          }).catch((emailError) => {
            console.error(`Failed to enqueue welcome email to ${email}:`, emailError);
            return [];
          })
        );
      }
    }

    if (emailPromises.length > 0) {
      try {
        await Promise.all(emailPromises);
      } catch (emailError) {
        console.error('Failed to enqueue welcome emails:', emailError);
      }
    }

    return addedMembers;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (isUniqueConstraintViolation(error)) {
      throw new AppError('Already a member of this course', ErrorCodes.CONFLICT, 409);
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add course members',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @param data Partial member data to update
 * @returns Updated member
 */
export async function updateMember(
  courseId: string,
  memberId: string,
  data: Partial<TGroupmember>,
  actorProfileId?: string
) {
  try {
    const existingMember = await getCourseMember(courseId, memberId);
    if (!existingMember) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const previousRoleId = existingMember.roleId;
    const nextRoleId = data.roleId ?? previousRoleId;
    const becameStudent = data.roleId !== undefined && previousRoleId !== ROLE.STUDENT && nextRoleId === ROLE.STUDENT;
    const leftStudent = data.roleId !== undefined && previousRoleId === ROLE.STUDENT && nextRoleId !== ROLE.STUDENT;
    const studentRoleChanged = becameStudent || leftStudent;

    const updated = await db.transaction(async (tx) => {
      // Only applies while the role is still the one the grant decision was
      // based on; a concurrent change surfaces as 409 instead of a stale grant.
      const expectedRoleId = data.roleId !== undefined ? previousRoleId : undefined;
      const next = await updateCourseMember(courseId, memberId, data, tx, expectedRoleId);

      if (!next) {
        const current = await getCourseMember(courseId, memberId, tx);

        if (!current) {
          throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
        }

        throw new AppError(
          "This member's role changed while you were editing. Refresh and try again.",
          ErrorCodes.CONFLICT,
          409
        );
      }

      if (becameStudent) {
        await assertCourseAllowsDirectStudentAdd(courseId, tx);
        await recordDirectCourseGrant(
          { groupmemberId: next.id, courseId, profileId: next.profileId },
          { source: 'ADMIN_ADD', grantedByProfileId: actorProfileId },
          tx
        );
      }

      if (leftStudent) {
        await revokeGrantsForGroupmember(next.id, tx);
      }

      return next;
    });

    if (studentRoleChanged) {
      const statsOrgId = await getOrgIdByCourseId(courseId);
      await invalidateOrgStats(statsOrgId);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (isUniqueConstraintViolation(error)) {
      throw new AppError('Another member of this course already uses that email', ErrorCodes.CONFLICT, 409);
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a course member
 * @param courseId Course ID
 * @param memberId Member ID
 * @returns Deleted member
 */
export async function deleteMember(
  courseId: string,
  memberId: string,
  context: { actorProfileId?: string | null; reason?: string | null } = {}
) {
  try {
    const progressBeforeRemoval = await readProgressAtRemoval(courseId, memberId);
    const deleted = await db.transaction(async (tx) => {
      const existing = await getCourseMember(courseId, memberId, tx);

      if (!existing) {
        return null;
      }

      // Defensive only: deleting the membership cascades to its grants via
      // ON DELETE CASCADE. Revoke first so a missing cascade still cannot
      // leave a live grant behind.
      await revokeGrantsForGroupmember(existing.id, tx);
      const removed = await deleteCourseMember(courseId, memberId, tx);

      return removed;
    });

    if (!deleted) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (deleted.roleId === ROLE.STUDENT) {
      const statsOrgId = await getOrgIdByCourseId(courseId);
      await invalidateOrgStats(statsOrgId);
    }

    await emitCourseMemberRemovedWebhookEvent(courseId, deleted, {
      actorProfileId: context.actorProfileId,
      reason: context.reason,
      progressAtRemoval: progressBeforeRemoval
    });

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete course member',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Resets all learner progress for a course member while keeping them enrolled.
 */
export async function resetMemberCourseProgress(courseId: string, memberId: string, actorProfileId: string) {
  try {
    const member = await getCourseMember(courseId, memberId);
    if (!member || !member.profileId) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    if (member.roleId !== ROLE.STUDENT) {
      throw new AppError('Only student progress can be reset', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const { summary, resetLessonIds, resetExerciseIds } = await resetStudentCourseProgress({
      courseId,
      groupMemberId: memberId,
      profileId: member.profileId
    });

    console.info('resetMemberCourseProgress', {
      actorProfileId,
      courseId,
      memberId,
      summary
    });

    const statsOrgId = await getOrgIdByCourseId(courseId);
    await invalidateOrgStats(statsOrgId);

    const profileId = member.profileId;
    const lessonResetEvents = profileId
      ? resetLessonIds.map((lessonId) =>
          emitCourseWebhookEvent(courseId, 'lesson.completion.updated', { lessonId, profileId, isComplete: false })
        )
      : [];
    const exerciseResetEvents = resetExerciseIds.map((exerciseId) =>
      emitCourseWebhookEvent(courseId, 'exercise.completion.updated', {
        exerciseId,
        memberId,
        profileId,
        isComplete: false
      })
    );

    await Promise.all([...lessonResetEvents, ...exerciseResetEvents]);

    // A teacher's reset is not learner activity, so it must not move "last activity".
    void syncCourseProgressInLearningPaths(courseId, member.profileId, undefined, { recordActivity: false }).catch(
      (syncError) => {
        console.error('Failed to sync learning path progress after resetting course progress:', syncError);
      }
    );

    return summary;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reset course member progress',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
