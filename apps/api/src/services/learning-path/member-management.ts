import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  enrollMember,
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
  revokeLearningPathGrants
} from '@cio/db/queries/learning-path';
import { getCourseGroupIds } from '@cio/db/queries/course/course';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import { getOrganizationById } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';
import type { TAddLearningPathMembers, TPathMembersQuery } from '@cio/utils/validation/learning-path';
import type { TListMembersResult } from '@cio/db/queries/learning-path';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';
import { sendLearningPathWelcomeEmail } from './email';
import { throwAsInternal } from '@api/utils/errors';

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
 */
export async function enrollProfileInLearningPath(
  path: { id: string; autoEnroll: boolean; sequentialUnlock: boolean },
  input: { profileId: string; email?: string | null; roleId: number; grantedByProfileId?: string },
  dbClient: DbOrTxClient = db
) {
  const run = async (tx: DbOrTxClient) => {
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

    return await db.transaction(run);
  } catch (error) {
    throwAsInternal(error, 'Failed to enroll profile in learning path');
  }
}

/**
 * Adds one or more members to a learning path, initializes progress cache,
 * and auto-enrolls them in the path's courses if autoEnroll is enabled.
 */
export async function addPathMembersService(
  pathId: string,
  payload: TAddLearningPathMembers,
  userId: string,
  orgRoles?: Record<string, number>
) {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  const hasTutorRole = payload.members.some((member) => member.roleId === ROLE.TUTOR);
  if (hasTutorRole && orgRoles?.[path.organizationId] !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403);
  }

  const { enrolledMembers, welcomeCandidates } = await db.transaction(async (tx) => {
    const enrolledMembers = [];
    const welcomeCandidates: Array<{ profileId: string; email: string | null }> = [];

    for (const memberInput of payload.members) {
      if (!memberInput.profileId) {
        throw new AppError(
          'Learning path members must have a profile. Invite new learners by email so they join the path when they accept the invite.',
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }

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
