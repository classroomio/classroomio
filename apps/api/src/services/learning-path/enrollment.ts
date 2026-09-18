import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import {
  enrollMember,
  getCourseCompletionStatsForProfile,
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
import {
  createOrganizationMember,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile
} from '@cio/db/queries/organization';
import type { TLearningPath, TLearningPathMember } from '@cio/db/types';

import { resolveLearningPath } from './learning-path';
import { syncLearningPathProgressForMember } from './unlock';

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

    // Enforce organization-level enrollment safeguards
    const organization = await getOrganizationById(path.organizationId, transactionClient);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const isInternalOnly = organization.settings?.internalEnrollmentOnly ?? false;
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(path.organizationId, profileId, transactionClient);

    if (isInternalOnly && !orgMemberId) {
      throw new AppError(
        'This organization only allows its members to enroll. Ask an admin for an invitation.',
        ErrorCodes.FORBIDDEN,
        403
      );
    }

    if (!orgMemberId) {
      await assertStudentCapacityOrThrow(path.organizationId, 1, transactionClient);

      await createOrganizationMember(
        {
          organizationId: path.organizationId,
          roleId: ROLE.STUDENT,
          profileId,
          verified: true
        },
        transactionClient
      );
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
 * Derives unlocked course IDs from pre-computed completion stats,
 * avoiding redundant DB queries that `unlockedCourses` would make.
 */
function unlockedCoursesFromStats(
  sequentialUnlock: boolean,
  courseIds: string[],
  completionByCourseId: Map<string, boolean>
): string[] {
  if (!sequentialUnlock) {
    return courseIds;
  }

  const unlocked: string[] = [];
  for (const courseId of courseIds) {
    unlocked.push(courseId);
    if (!completionByCourseId.get(courseId)) {
      break;
    }
  }

  return unlocked;
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
    const syncedPathIds = new Set<string>();

    for (const { member, learningPath } of enrolledRows) {
      const courses = await listLearningPathCourses(learningPath.id);
      const courseIds = courses.map((course) => course.courseId);

      // Fetch completion stats once per course in parallel
      const statsResults = await Promise.all(
        courses.map((course) => getCourseCompletionStatsForProfile(course.courseId, profileId))
      );
      const completionByCourseId = new Map(courses.map((course, i) => [course.courseId, statsResults[i].isComplete]));

      // Derive unlock status from pre-computed completion
      const unlocked = unlockedCoursesFromStats(learningPath.sequentialUnlock, courseIds, completionByCourseId);

      const cachedProgressRows = await getMemberCourseProgress(member.id);
      const progressByPathCourseId = new Map(cachedProgressRows.map((r) => [r.learningPathCourseId, r]));

      const coursesWithProgress: TEnrolledCourseProgress[] = [];
      let completedCount = 0;
      const driftedCourseIds: string[] = [];

      for (const course of courses) {
        const isComplete = completionByCourseId.get(course.courseId) ?? false;
        if (isComplete) {
          completedCount++;
        }

        const isUnlocked = unlocked.includes(course.courseId);
        coursesWithProgress.push({
          ...course,
          isUnlocked,
          isComplete
        });

        // Detect cache drift to collect courses needing background sync
        const cached = progressByPathCourseId.get(course.id);
        const expectedStatus = isComplete ? 'COMPLETED' : !isUnlocked ? 'LOCKED' : undefined;
        const hasStatusDrift =
          (expectedStatus && cached?.status !== expectedStatus) || (cached?.status === 'LOCKED' && isUnlocked);
        if (!cached || hasStatusDrift) {
          driftedCourseIds.push(course.courseId);
        }
      }

      // Heal all drifted courses sequentially in the background
      if (driftedCourseIds.length > 0 && !syncedPathIds.has(learningPath.id)) {
        syncedPathIds.add(learningPath.id);
        void (async () => {
          try {
            for (const courseId of driftedCourseIds) {
              await syncLearningPathProgressForMember(courseId, profileId);
            }
          } catch (syncErr) {
            console.error('Self-healing learning path progress cache failed:', syncErr);
          }
        })();
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
