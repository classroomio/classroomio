import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import {
  enrollMember,
  getEnrolledPaths,
  getLearningPathCertificate,
  getMemberCourseProgress,
  grantCourseAccess,
  initializeMemberCourseProgress,
  listLearningPathCourses,
  type TLearningPathCourseDetail
} from '@cio/db/queries/learning-path';
import { getCourseGroupIds } from '@cio/db/queries/course/course';
import { getGroupMemberIdByGroupAndProfile, insertGroupMembersOnConflictDoNothing } from '@cio/db/queries/group';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import { resolveLearningPath } from './learning-path';
import { courseCompleteForPath, syncLearningPathProgressForMember, unlockedCourses } from './unlock';

export interface TEnrolledCourseProgress extends TLearningPathCourseDetail {
  isUnlocked: boolean;
  isComplete: boolean;
}

export interface TEnrolledLearningPathWithProgress extends TLearningPath {
  member: {
    id: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    enrolledAt: string;
    completedAt: string | null;
    progressPercent: number;
    completedCourseCount: number;
    currentCourseId: string | null;
  };
  certificate: {
    certificateId: string;
    issuedAt: string;
    fileUrl: string | null;
  } | null;
  courses: TEnrolledCourseProgress[];
}

/**
 * Enrolls a student into a learning path and auto-enrolls them into all courses in the path.
 * Wraps member creation, course group membership, and enrollment grant records in a single transaction.
 * Idempotent on repeated calls.
 */
export async function enrollInLearningPath(pathId: string, profileId: string): Promise<TLearningPathMember> {
  return await db.transaction(async (transactionClient) => {
    const path = await resolveLearningPath(pathId, transactionClient);

    if (!path.isPublished) {
      throw new AppError('Learning path is not published', ErrorCodes.PATH_NOT_PUBLISHED, 400);
    }

    if (!path.selfEnrollment) {
      throw new AppError('Self-enrollment is disabled for this learning path', ErrorCodes.FORBIDDEN, 403);
    }

    // 1. Enroll member in learning path
    const member = await enrollMember(
      {
        learningPathId: path.id,
        profileId,
        roleId: ROLE.STUDENT,
        status: 'NOT_STARTED'
      },
      transactionClient
    );

    // 2. Fetch courses in path
    const courses = await listLearningPathCourses(path.id, transactionClient);
    const courseIds = courses.map((course) => course.courseId);

    // 2b. Initialize member course progress cache
    await initializeMemberCourseProgress(
      member.id,
      courses.map((course) => ({ id: course.id, order: course.order })),
      path.sequentialUnlock,
      transactionClient
    );

    if (courseIds.length > 0) {
      // 3. Auto-enroll in each course's group
      const courseGroups = await getCourseGroupIds(courseIds, transactionClient);

      const groupMemberValues = courseGroups
        .filter((entry): entry is { courseId: string; groupId: string } => Boolean(entry.groupId))
        .map((entry) => ({
          groupId: entry.groupId,
          profileId,
          roleId: ROLE.STUDENT
        }));

      await insertGroupMembersOnConflictDoNothing(groupMemberValues, transactionClient);

      // 4. Record grant provenance for each course
      for (const entry of courseGroups) {
        if (!entry.groupId) continue;

        const groupMemberId = await getGroupMemberIdByGroupAndProfile(entry.groupId, profileId, transactionClient);

        if (groupMemberId) {
          await grantCourseAccess(
            {
              groupmemberId: groupMemberId,
              courseId: entry.courseId,
              profileId,
              source: 'LEARNING_PATH',
              learningPathId: path.id
            },
            transactionClient
          );
        }
      }
    }

    return member;
  });
}

/**
 * Returns learning paths that the student is actively enrolled in,
 * including live progress calculations and per-course unlock status.
 */
export async function getEnrolledLearningPaths(
  profileId: string,
  organizationId?: string
): Promise<TEnrolledLearningPathWithProgress[]> {
  try {
    const enrolledRows = await getEnrolledPaths(profileId, organizationId);

    const results: TEnrolledLearningPathWithProgress[] = [];

    for (const { member, learningPath } of enrolledRows) {
      const courses = await listLearningPathCourses(learningPath.id);
      const courseIds = courses.map((course) => course.courseId);

      const unlocked = await unlockedCourses({ sequentialUnlock: learningPath.sequentialUnlock, courseIds }, profileId);
      const cachedProgressRows = await getMemberCourseProgress(member.id);
      const progressByPathCourseId = new Map(cachedProgressRows.map((r) => [r.learningPathCourseId, r]));

      const coursesWithProgress: TEnrolledCourseProgress[] = [];
      let completedCount = 0;

      for (const course of courses) {
        const isComplete = await courseCompleteForPath(profileId, course.courseId);
        if (isComplete) {
          completedCount++;
        }

        const isUnlocked = unlocked.includes(course.courseId);
        coursesWithProgress.push({
          ...course,
          isUnlocked,
          isComplete
        });

        // Self-heal: If cache row is missing, or status drifted, trigger background sync.
        // A LOCKED row for a course the member can now access also counts as drift
        // (e.g. a course appended after the member completed all prior courses, if that is
        // possible).
        const cached = progressByPathCourseId.get(course.id);
        const expectedStatus = isComplete ? 'COMPLETED' : !isUnlocked ? 'LOCKED' : undefined;
        const hasStatusDrift =
          (expectedStatus && cached?.status !== expectedStatus) || (cached?.status === 'LOCKED' && isUnlocked);
        if (!cached || hasStatusDrift) {
          void syncLearningPathProgressForMember(course.courseId, profileId).catch((syncErr) => {
            console.error('Self-healing learning path progress cache failed:', syncErr);
          });
        }
      }

      const totalCourses = courses.length;
      const progressPercent = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

      const certificateRow = await getLearningPathCertificate(member.id);
      const certificateData = certificateRow
        ? {
            certificateId: certificateRow.certificateId,
            issuedAt: certificateRow.issuedAt,
            fileUrl: certificateRow.fileUrl
          }
        : null;

      const memberProgressData = {
        id: member.id,
        status: member.status,
        enrolledAt: member.enrolledAt,
        completedAt: member.completedAt,
        progressPercent,
        completedCourseCount: completedCount,
        currentCourseId: member.currentCourseId
      };

      results.push({
        ...learningPath,
        member: memberProgressData,
        certificate: certificateData,
        courses: coursesWithProgress
      });
    }

    return results;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get enrolled learning paths',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
