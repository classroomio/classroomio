import { ROLE } from '@cio/utils/constants';
import { getInvitedPersonStatus } from '@cio/utils/functions/invite-metadata';
import { AppError, ErrorCodes, membershipConflictError } from '@api/utils/errors';
import { isUniqueConstraintViolation } from '@cio/utils/errors';
import {
  addCourseMember,
  deleteCourseMember,
  getCourseGroupId,
  getCourseMember,
  getPaginatedCourseMembers,
  getPaginatedInvitedCourseMembers,
  updateCourseMember,
  type TInvitedCourseMemberRow
} from '@cio/db/queries/course/people';
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
import { pageJoinedThenInvited } from '@api/utils/joined-then-invited-page';
import { getCourseWithOrgData, getOrgIdByCourseId } from '@cio/db/queries/course';
import { getProfileById } from '@cio/db/queries/auth';
import { buildEmailFromName, buildEmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { ensureComplianceEnrollmentRecordsForProfiles } from './compliance';
import { getCourseMemberProgressSummaries } from './member-progress';
import { getWelcomeSessionIcs } from './session-invite';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnersEnrolled } from '@api/services/product-events';

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
 * With no membership filter, invited people follow the joined members unless a filter only joined members can match is set.
 * @returns One page of course members with profile, progress and stage data, plus pagination totals
 */
export async function listPaginatedCourseMembers(courseId: string, query: PaginatedCourseMembersOptions) {
  try {
    if (query.membership === 'invited') {
      return listInvitedCourseMembers(courseId, query);
    }

    if (!query.membership && !hasJoinedOnlyFilter(query)) {
      return listJoinedThenInvitedCourseMembers(courseId, query);
    }

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

function hasJoinedOnlyFilter(query: PaginatedCourseMembersOptions): boolean {
  return Boolean(
    query.progress ||
      query.enrolledWithin ||
      query.lastLoginBefore ||
      query.email ||
      query.certificateEarned !== undefined
  );
}

async function listJoinedThenInvitedCourseMembers(courseId: string, query: PaginatedCourseMembersOptions) {
  const groupId = await getCourseGroupId(courseId);
  const page = await pageJoinedThenInvited({
    page: query.page,
    limit: query.limit,
    fetchJoined: (offset, limit) =>
      getPaginatedCourseMembers(courseId, { ...query, membership: 'joined', offset, limit }),
    fetchInvited: (offset, limit) =>
      getPaginatedInvitedCourseMembers(courseId, {
        page: 1,
        limit,
        offset,
        search: query.search,
        roleId: query.roleId
      })
  });
  const invitedMembers = page.invited.map((row) => toInvitedCourseMember(row, groupId));
  const items = await addMemberStages(courseId, [...page.joined, ...invitedMembers]);

  return {
    items,
    page: query.page,
    limit: query.limit,
    total: page.total,
    totalPages: page.total === 0 ? 0 : Math.ceil(page.total / query.limit)
  };
}

/**
 * Maps an invited union row onto the roster item shape so the People table can
 * render it with the same cells: no profile, no progress, and an `invitation`
 * payload that tells the row actions which invite to resend or revoke.
 */
function toInvitedCourseMember(row: TInvitedCourseMemberRow, groupId: string | null): PaginatedCourseMember {
  const createdAt = row.memberCreatedAt ?? row.inviteCreatedAt;
  const status = getInvitedPersonStatus(row.inviteExpiresAt);

  return {
    id: row.groupMemberId ?? `invited:${row.kind}:${(row.email ?? '').toLowerCase()}`,
    groupId: groupId ?? '',
    profileId: null,
    roleId: row.roleId ?? ROLE.STUDENT,
    email: row.email,
    createdAt,
    assignedStudentId: null,
    completedAt: null,
    certificateEarnedAt: null,
    certificationEmailSentAt: null,
    profile: null,
    progressPercent: 0,
    progressBucket: null,
    lastLoginAt: null,
    enrolledAt: createdAt,
    membership: 'invited',
    invitation: {
      kind: row.kind,
      status,
      groupMemberId: row.groupMemberId,
      orgInviteId: row.orgInviteId,
      courseInviteId: row.courseInviteId,
      expiresAt: row.inviteExpiresAt,
      courseIds: row.courseIds,
      cohortIds: row.cohortIds
    }
  };
}

async function listInvitedCourseMembers(courseId: string, query: PaginatedCourseMembersOptions) {
  const [groupId, result] = await Promise.all([
    getCourseGroupId(courseId),
    getPaginatedInvitedCourseMembers(courseId, {
      page: query.page,
      limit: query.limit,
      search: query.search
    })
  ]);
  const items = await addMemberStages(
    courseId,
    result.items.map((row) => toInvitedCourseMember(row, groupId))
  );

  return {
    ...result,
    items
  };
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
  options: { sendEmail?: boolean; rejectExisting?: boolean } = {}
) {
  const { sendEmail = true, rejectExisting = false } = options;

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
      if (member.roleId === ROLE.STUDENT && !member.profileId) {
        throw new AppError(
          'Students must be added with a profileId. Invite them by email so they join first',
          ErrorCodes.VALIDATION_ERROR,
          400,
          'profileId'
        );
      }
    }

    // Get course title and organization data for emails (simple query, no expensive joins)
    const courseOrgData = await getCourseWithOrgData(courseId);

    if (!courseOrgData) {
      throw new AppError('Course not found', ErrorCodes.NOT_FOUND, 404);
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
    const addedMembers: TGroupmember[] = [];
    const addedInputs: TAddCourseMembers = [];
    let addedStudentMember = false;

    try {
      for (const member of members) {
        const { member: addedMember, created } = await addCourseMember(courseId, member);

        if (!created) {
          if (rejectExisting || Number(addedMember.roleId) !== Number(member.roleId)) {
            throw new AppError('Already a member of this course', ErrorCodes.COURSE_MEMBER_EXISTS, 409);
          }

          continue;
        }

        addedMembers.push(addedMember);
        addedInputs.push(member);
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

    const studentProfileIds = addedInputs
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
    const addedStudents = addedInputs.filter((member) => member.roleId === ROLE.STUDENT);
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

    addedInputs.forEach((memberData) => {
      const roleId = memberData.roleId;
      const email = memberData.email;
      const name = memberData.name;

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
    });

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
    const conflict = membershipConflictError(error);
    if (conflict) {
      throw conflict;
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
export async function updateMember(courseId: string, memberId: string, data: Partial<TGroupmember>) {
  try {
    const existingMember = await getCourseMember(courseId, memberId);
    if (!existingMember) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const updated = await updateCourseMember(courseId, memberId, data);
    if (!updated) {
      throw new AppError('Course member not found', ErrorCodes.NOT_FOUND, 404);
    }

    const previousRoleId = existingMember.roleId;
    const nextRoleId = data.roleId ?? previousRoleId;
    const studentRoleChanged =
      data.roleId !== undefined && (previousRoleId === ROLE.STUDENT || nextRoleId === ROLE.STUDENT);

    if (studentRoleChanged) {
      const statsOrgId = await getOrgIdByCourseId(courseId);
      await invalidateOrgStats(statsOrgId);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const conflict = membershipConflictError(error);
    if (conflict) {
      throw conflict;
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
    const deleted = await deleteCourseMember(courseId, memberId);
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
