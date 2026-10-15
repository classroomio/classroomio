import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import type { TAddLearningPathCourse } from '@cio/utils/validation/learning-path';
import type { TAddableCoursesQuery } from '@cio/utils/validation/course';
import { db } from '@cio/db/drizzle';
import { getAddableOrgCourses, getCourseOrgInfo } from '@cio/db/queries/course/course';
import {
  addCourseToPath,
  backfillMemberCourseProgressForAddedCourse,
  getCourseIdsInPath,
  grantCourseAccess,
  listActivePathMemberIds,
  removeCourseFromPath,
  reorderLearningPathCourses,
  updateLearningPath
} from '@cio/db/queries/learning-path';
import { getGroupMemberByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import type { TLearningPathCourse } from '@cio/db/types';

import { resolveLearningPath, assertCanManageLearningPath } from './learning-path';
import { scheduleLearningPathProgressSync } from './progress-sync-jobs';

/**
 * Pages the courses this path can still add, for the add-courses picker:
 * ACTIVE courses in the path's org without an active link to the path.
 * Path-only courses stay in, since a path is the only way to take them. Org
 * admins see every course; path tutors see the courses they belong to.
 */
export async function listAddablePathCoursesService(
  pathId: string,
  actorId: string,
  orgRoles: Record<string, number> | undefined,
  query: TAddableCoursesQuery
) {
  const path = await resolveLearningPath(pathId);
  await assertCanManageLearningPath(path, actorId, orgRoles);

  const isOrgAdmin = orgRoles?.[path.organizationId] === ROLE.ADMIN;
  const { items, total } = await getAddableOrgCourses({
    orgId: path.organizationId,
    memberProfileId: isOrgAdmin ? undefined : actorId,
    excludeLearningPathId: path.id,
    search: query.search,
    page: query.page,
    limit: query.limit
  });
  const totalPages = Math.ceil(total / query.limit);

  return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } };
}

/**
 * Adds one or more courses to a learning path and grants them to existing STUDENT members.
 * Executes inside an atomic transaction.
 */
export async function addCoursesToPathService(
  pathId: string,
  payload: TAddLearningPathCourse,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TLearningPathCourse[]> {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const courseIds = payload.courseIds ?? (payload.courseId ? [payload.courseId] : []);
    if (courseIds.length === 0) {
      throw new AppError('At least one courseId must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const addedCourses = await db.transaction(async (tx) => {
      const addedCourses: TLearningPathCourse[] = [];
      const members = await listActivePathMemberIds(path.id, tx);
      const activeMemberIds = members.map((member) => member.id);
      const studentMembers = members.filter((member) => Boolean(member.profileId) && member.roleId === ROLE.STUDENT);

      for (const courseId of courseIds) {
        // Validate course existence and org ownership
        const courseRow = await getCourseOrgInfo(courseId, tx);

        if (!courseRow || courseRow.organizationId !== path.organizationId) {
          throw new AppError(`Course "${courseId}" not found in this organization`, ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        const added = await addCourseToPath(path.id, courseId, tx);
        addedCourses.push(added);

        await backfillMemberCourseProgressForAddedCourse(activeMemberIds, added.id, path.sequentialUnlock, tx);

        // Grant the new course to existing STUDENT members
        if (courseRow.groupId) {
          if (studentMembers.length > 0) {
            const groupMemberValues = studentMembers.map((member) => ({
              groupId: courseRow.groupId!,
              roleId: ROLE.STUDENT,
              profileId: member.profileId!
            }));

            await insertGroupMembersOnConflictDoNothing(groupMemberValues, tx);

            for (const member of studentMembers) {
              const groupMember = await getGroupMemberByGroupAndProfile(courseRow.groupId!, member.profileId!, tx);

              // The insert above skips a profile already in the course group,
              // so this can be a TUTOR/ADMIN row. Staff access comes from the
              // role: a LEARNING_PATH grant goes on STUDENT rows only.
              if (groupMember?.roleId === ROLE.STUDENT) {
                await grantCourseAccess(
                  {
                    groupmemberId: groupMember.id,
                    courseId,
                    profileId: member.profileId!,
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

      if (addedCourses.length > 0) {
        const nowIso = new Date().toISOString();
        await updateLearningPath(path.id, { courseOrderSetAt: nowIso }, tx);
      }

      return addedCourses;
    });

    // Members may already have done the new courses, and a finished path is now unfinished.
    if (addedCourses.length > 0) {
      scheduleLearningPathProgressSync({ pathId: path.id });
    }

    return addedCourses;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to add courses to learning path',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Removes a course from a learning path.
 * Does NOT touch groupmember rows, course entity, or learner progress.
 */
export async function removeCourseFromPathService(
  pathId: string,
  courseId: string,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TLearningPathCourse> {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const removed = await removeCourseFromPath(path.id, courseId);
    if (!removed) {
      throw new AppError('Course not found in learning path', ErrorCodes.LEARNING_PATH_COURSE_NOT_FOUND, 404);
    }

    // Removing the last unfinished course can complete the path for its members.
    scheduleLearningPathProgressSync({ pathId: path.id });

    return removed;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to remove course from learning path',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Reorders courses in a learning path atomically.
 * Validates that all submitted courseIds belong to the path before writing.
 */
export async function reorderPathCoursesService(
  pathId: string,
  courseIds: string[],
  userId: string,
  orgRoles?: Record<string, number>
): Promise<{ reordered: true }> {
  try {
    const reorderedPathId = await db.transaction(async (tx) => {
      const path = await resolveLearningPath(pathId, tx);
      await assertCanManageLearningPath(path, userId, orgRoles, tx);

      const existingCourseIds = await getCourseIdsInPath(path.id, tx);
      const existingSet = new Set(existingCourseIds);
      const submittedSet = new Set(courseIds);

      if (
        courseIds.length !== existingCourseIds.length ||
        submittedSet.size !== courseIds.length ||
        !courseIds.every((id) => existingSet.has(id))
      ) {
        throw new AppError('Invalid course in path', ErrorCodes.INVALID_COURSE_IN_PATH, 400);
      }

      await reorderLearningPathCourses(path.id, courseIds, tx);

      const nowIso = new Date().toISOString();
      await updateLearningPath(path.id, { courseOrderSetAt: nowIso }, tx);

      return path.id;
    });

    // With sequential unlock, the new order changes which courses are locked.
    scheduleLearningPathProgressSync({ pathId: reorderedPathId });

    return { reordered: true };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reorder learning path courses',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
