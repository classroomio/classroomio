import { AppError, ErrorCodes } from '@api/utils/errors';
import { db } from '@cio/db/drizzle';
import {
  enrollMember,
  getMemberById,
  getPathCourseFunnelStats,
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

import { assertCanManageLearningPath, resolveLearningPath } from './learning-path';

/**
 * Lists active members in a learning path.
 */
export async function listPathMembersService(
  pathId: string,
  userId: string,
  orgRoles?: Record<string, number>,
  options?: TPathMembersQuery
) {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, userId, orgRoles);

  return await listLearningPathMembers(path.id, options);
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

  return await db.transaction(async (tx) => {
    const courses = await listLearningPathCourses(path.id, tx);
    const courseIds = courses.map((course) => course.courseId);
    const courseGroups = courseIds.length > 0 ? await getCourseGroupIds(courseIds, tx) : [];

    const enrolledMembers = [];

    for (const memberInput of payload.members) {
      const member = await enrollMember(
        {
          learningPathId: path.id,
          profileId: memberInput.profileId ?? null,
          email: memberInput.email ?? null,
          roleId: memberInput.roleId,
          status: 'NOT_STARTED'
        },
        tx
      );

      enrolledMembers.push(member);

      if (memberInput.profileId) {
        await initializeMemberCourseProgress(
          member.id,
          courses.map((course) => ({ id: course.id, order: course.order })),
          path.sequentialUnlock,
          tx
        );

        if (path.autoEnroll && courseGroups.length > 0) {
          const groupMemberValues = courseGroups
            .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
            .map((entry) => ({
              groupId: entry.groupId,
              profileId: memberInput.profileId!,
              roleId: memberInput.roleId
            }));

          await insertGroupMembersOnConflictDoNothing(groupMemberValues, tx);

          for (const entry of courseGroups) {
            if (!entry.groupId) continue;

            const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, memberInput.profileId!, tx);

            if (groupMemberId) {
              await grantCourseAccess(
                {
                  groupmemberId: groupMemberId,
                  courseId: entry.courseId,
                  profileId: memberInput.profileId!,
                  source: 'LEARNING_PATH',
                  learningPathId: path.id,
                  grantedByProfileId: userId
                },
                tx
              );
            }
          }
        }
      }
    }

    return enrolledMembers;
  });
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

  const members = await listLearningPathMembers(path.id);
  const courses = await listLearningPathCourses(path.id);

  const totalMembers = members.length;
  let notStartedCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let totalProgress = 0;

  for (const m of members) {
    if (m.status === 'COMPLETED') {
      completedCount++;
    } else if (m.status === 'IN_PROGRESS') {
      inProgressCount++;
    } else {
      notStartedCount++;
    }

    totalProgress += m.progressPercent ?? 0;
  }

  const averageProgress = totalMembers > 0 ? Math.round(totalProgress / totalMembers) : 0;

  const funnelStats = await getPathCourseFunnelStats(path.id);

  const courseFunnel = funnelStats.map((f) => ({
    courseId: f.courseId,
    title: f.title,
    order: f.order,
    completedCount: f.completedCount,
    completionRate: totalMembers > 0 ? Math.round((f.completedCount / totalMembers) * 100) : 0
  }));

  return {
    summary: {
      totalMembers,
      notStarted: notStartedCount,
      inProgress: inProgressCount,
      completed: completedCount,
      averageProgress
    },
    courses: courseFunnel
  };
}
