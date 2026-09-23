import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  enrollMember,
  getMemberById,
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
import type { TAddLearningPathMembers, TPathMembersQuery } from '@cio/utils/validation/learning-path';
import type { TListMembersResult } from '@cio/db/queries/learning-path';

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';

/**
 * Lists active members in a learning path.
 */
export async function listPathMembersService(
  pathId: string,
  userId: string,
  orgRoles: Record<string, number> | undefined,
  options: TPathMembersQuery
): Promise<TListMembersResult> {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  return await listLearningPathMembers(path.id, options);
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
  const member = await enrollMember(
    {
      learningPathId: path.id,
      profileId: input.profileId,
      email: input.email ?? null,
      roleId: input.roleId,
      status: 'NOT_STARTED'
    },
    dbClient
  );

  const courses = await listLearningPathCourses(path.id, dbClient);

  await initializeMemberCourseProgress(
    member.id,
    courses.map((course) => ({ id: course.id, order: course.order })),
    path.sequentialUnlock,
    dbClient
  );

  if (path.autoEnroll) {
    const courseIds = courses.map((course) => course.courseId);
    const courseGroups = courseIds.length > 0 ? await getCourseGroupIds(courseIds, dbClient) : [];

    if (courseGroups.length > 0) {
      const groupMemberValues = courseGroups
        .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
        .map((entry) => ({
          groupId: entry.groupId,
          profileId: input.profileId,
          roleId: ROLE.STUDENT
        }));

      await insertGroupMembersOnConflictDoNothing(groupMemberValues, dbClient);

      for (const entry of courseGroups) {
        if (!entry.groupId) continue;

        const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, input.profileId, dbClient);

        if (groupMemberId) {
          await grantCourseAccess(
            {
              groupmemberId: groupMemberId,
              courseId: entry.courseId,
              profileId: input.profileId,
              source: 'LEARNING_PATH',
              learningPathId: path.id,
              grantedByProfileId: input.grantedByProfileId
            },
            dbClient
          );
        }
      }
    }
  }

  return member;
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

  return await db.transaction(async (tx) => {
    const enrolledMembers = [];

    for (const memberInput of payload.members) {
      if (!memberInput.profileId) {
        throw new AppError(
          'Learning path members must have a profile. Invite new learners by email so they join the path when they accept the invite.',
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }

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
    }

    return enrolledMembers;
  });
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
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  const detail = await getPathMemberDetail(path.id, personId);
  if (!detail) {
    throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
  }

  return detail;
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
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  const member = await getMemberById(memberId);
  if (!member || member.learningPathId !== path.id) {
    throw new AppError('Learning path member not found', ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, 404);
  }

  return await db.transaction(async (tx) => {
    const removed = await removeMember(memberId, tx);

    if (member.profileId) {
      await revokeLearningPathGrants(path.id, member.profileId, tx);
    }

    return removed;
  });
}

/**
 * Returns aggregated funnel metrics and per-course completion stats for a learning path.
 */
export async function getPathAnalyticsService(pathId: string, userId: string, orgRoles?: Record<string, number>) {
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
}
