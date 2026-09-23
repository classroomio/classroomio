import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import type { TAddLearningPathCourse, TUpdateLearningPathCourse } from '@cio/utils/validation/learning-path';
import { db } from '@cio/db/drizzle';
import { getCourseOrgInfo } from '@cio/db/queries/course/course';
import {
  addCourseToPath,
  backfillMemberCourseProgressForAddedCourse,
  getCourseIdsInPath,
  grantCourseAccess,
  listLearningPathMembers,
  removeCourseFromPath,
  reorderLearningPathCourses,
  updateLearningPath,
  updateLearningPathCourse
} from '@cio/db/queries/learning-path';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import type { TLearningPathCourse } from '@cio/db/types';

import { resolveLearningPath, assertCanManageLearningPath } from './learning-path';

/**
 * Adds one or more courses to a learning path and auto-enrolls existing path members.
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

    return await db.transaction(async (tx) => {
      const addedCourses: TLearningPathCourse[] = [];
      const membersResult = await listLearningPathMembers(path.id, undefined, tx);
      const members = membersResult.data;
      const activeMemberIds = members.map((member) => member.id);

      for (const courseId of courseIds) {
        // Validate course existence and org ownership
        const courseRow = await getCourseOrgInfo(courseId, tx);

        if (!courseRow || courseRow.organizationId !== path.organizationId) {
          throw new AppError(`Course "${courseId}" not found in this organization`, ErrorCodes.COURSE_NOT_FOUND, 404);
        }

        const added = await addCourseToPath(path.id, courseId, tx);
        addedCourses.push(added);

        await backfillMemberCourseProgressForAddedCourse(activeMemberIds, added.id, path.sequentialUnlock, tx);

        // Auto-enroll existing students if enabled
        if (path.autoEnroll && courseRow.groupId) {
          const studentMembers = members.filter((m) => Boolean(m.profileId) && m.roleId === ROLE.STUDENT);

          if (studentMembers.length > 0) {
            const groupMemberValues = studentMembers.map((m) => ({
              groupId: courseRow.groupId!,
              roleId: ROLE.STUDENT,
              profileId: m.profileId!
            }));

            await insertGroupMembersOnConflictDoNothing(groupMemberValues, tx);

            for (const member of studentMembers) {
              const groupMemberId = await getGroupMemberIdByGroupAndProfile(courseRow.groupId!, member.profileId!, tx);

              if (groupMemberId) {
                await grantCourseAccess(
                  {
                    groupmemberId: groupMemberId,
                    courseId,
                    profileId: member.profileId!,
                    source: 'LEARNING_PATH',
                    learningPathId: path.id
                  },
                  tx
                );
              }
            }
          }
        }
      }

      return addedCourses;
    });
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
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const existingCourseIds = await getCourseIdsInPath(path.id);
    const existingSet = new Set(existingCourseIds);
    const submittedSet = new Set(courseIds);

    if (
      courseIds.length !== existingCourseIds.length ||
      submittedSet.size !== courseIds.length ||
      !courseIds.every((id) => existingSet.has(id))
    ) {
      throw new AppError('Invalid course in path', ErrorCodes.INVALID_COURSE_IN_PATH, 400);
    }

    await db.transaction(async (tx) => {
      await reorderLearningPathCourses(path.id, courseIds, tx);

      const nowIso = new Date().toISOString();
      await updateLearningPath(path.id, { courseOrderSetAt: nowIso }, tx);
    });

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

/**
 * Updates course details within a learning path (such as learning outcomes).
 */
export async function updateLearningPathCourseService(
  pathId: string,
  courseId: string,
  data: TUpdateLearningPathCourse,
  userId: string,
  orgRoles?: Record<string, number>
): Promise<TLearningPathCourse> {
  try {
    const path = await resolveLearningPath(pathId);
    await assertCanManageLearningPath(path, userId, orgRoles);

    const updated = await updateLearningPathCourse(path.id, courseId, data);
    if (!updated) {
      throw new AppError('Course not found in learning path', ErrorCodes.LEARNING_PATH_COURSE_NOT_FOUND, 404);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course in learning path',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
