import { AppError, ErrorCodes } from '@api/utils/errors';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getActiveGrantsForCourseAndProfile,
  getCourseCompletionStatsForProfile,
  getCourseIdsInPath,
  getLearningPathCertificate,
  getMemberByPathAndProfile,
  getPathsContainingCourseForMember,
  getSingleMemberCourseProgress,
  issueLearningPathCertificate,
  listLearningPathCourses,
  updateMemberProgress,
  upsertMemberCourseProgress
} from '@cio/db/queries/learning-path';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import type { TLearningPath } from '@cio/db/types';

import { resolveLearningPath } from './learning-path';

/**
 * Checks whether a single course is complete for a student within a learning path.
 * A course is complete when all lessons are completed AND all exercises are completed.
 */
export async function courseCompleteForPath(
  profileId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  const stats = await getCourseCompletionStatsForProfile(courseId, profileId, dbClient);
  return stats.isComplete;
}

/**
 * Returns the list of unlocked course IDs for a student in a learning path.
 * If sequentialUnlock is false, all courses are unlocked.
 * If sequentialUnlock is true, courses are unlocked up to the first incomplete course.
 */
export async function unlockedCourses(
  path: Pick<TLearningPath, 'sequentialUnlock'> & { courseIds: string[] },
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  if (!path.sequentialUnlock) {
    return path.courseIds;
  }

  const unlocked: string[] = [];
  for (const courseId of path.courseIds) {
    unlocked.push(courseId);
    const isComplete = await courseCompleteForPath(profileId, courseId, dbClient);
    if (!isComplete) {
      break;
    }
  }

  return unlocked;
}

export interface TPathCompletionResult {
  isComplete: boolean;
  completedAt: string | null;
  certificateId: string | null;
  progressPercent: number;
}

/**
 * Evaluates completion status and progress of a student in a learning path.
 * If all courses are complete, marks the member row COMPLETED and issues a certificate (if enabled).
 */
export async function evaluatePathCompletion(
  pathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TPathCompletionResult> {
  const path = await resolveLearningPath(pathId, dbClient);
  const member = await getMemberByPathAndProfile(path.id, profileId, dbClient);

  if (!member) {
    return {
      isComplete: false,
      completedAt: null,
      certificateId: null,
      progressPercent: 0
    };
  }

  const courseIds = await getCourseIdsInPath(path.id, dbClient);
  if (courseIds.length === 0) {
    return {
      isComplete: false,
      completedAt: null,
      certificateId: null,
      progressPercent: 0
    };
  }

  let completedCount = 0;
  let currentCourseId: string | null = null;

  for (const courseId of courseIds) {
    const isComplete = await courseCompleteForPath(profileId, courseId, dbClient);
    if (isComplete) {
      completedCount++;
    } else if (!currentCourseId) {
      currentCourseId = courseId;
    }
  }

  if (!currentCourseId && courseIds.length > 0) {
    currentCourseId = courseIds[courseIds.length - 1];
  }

  const progressPercent = Math.round((completedCount / courseIds.length) * 100);
  const isComplete = completedCount === courseIds.length;

  if (isComplete) {
    const nowIso = new Date().toISOString();
    const completedAt = member.completedAt ?? nowIso;

    if (!member.completedAt || member.status !== 'COMPLETED') {
      await updateMemberProgress(
        member.id,
        {
          status: 'COMPLETED',
          completedAt,
          progressPercent: 100,
          completedCourseCount: completedCount,
          currentCourseId: currentCourseId ?? undefined,
          lastActivityAt: nowIso
        },
        dbClient
      );
    }

    let certificateId: string | null = null;
    if (path.certificateEnabled) {
      const existingCert = await getLearningPathCertificate(member.id, dbClient);
      if (existingCert) {
        certificateId = existingCert.certificateId;
      } else {
        const certificateTitle = path.certificateTitle || path.name;
        const certificateIssuer = path.certificateIssuer;
        const idFormat = path.certificateDesign?.idFormat;

        const cert = await issueLearningPathCertificate(
          {
            learningPathId: path.id,
            learningPathMemberId: member.id,
            profileId,
            title: certificateTitle,
            issuer: certificateIssuer,
            idFormat
          },
          dbClient
        );
        certificateId = cert.certificateId;
      }
    }

    return {
      isComplete: true,
      completedAt,
      certificateId,
      progressPercent: 100
    };
  }

  // Path is in progress or not started
  const newStatus = completedCount > 0 ? 'IN_PROGRESS' : member.status;
  const currentActivityAt = new Date().toISOString();

  await updateMemberProgress(
    member.id,
    {
      status: newStatus,
      progressPercent,
      completedCourseCount: completedCount,
      currentCourseId: currentCourseId ?? undefined,
      lastActivityAt: currentActivityAt
    },
    dbClient
  );

  return {
    isComplete: false,
    completedAt: null,
    certificateId: null,
    progressPercent
  };
}

/**
 * Asserts that a course is not locked for a student.
 * If the course is part of a sequential learning path that the student is enrolled in,
 * and the course is not yet unlocked, throws 403 COURSE_LOCKED.
 *
 * Exemptions:
 * 1. Course team members (ADMIN, TUTOR) and Org Admins are always exempt.
 * 2. If the user has a standalone grant (source !== 'LEARNING_PATH'), access is permitted.
 * 3. If any enrolled learning path containing the course has unlocked it (or has sequentialUnlock === false), access is permitted.
 */
export async function assertCourseNotLockedForStudent(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  // 1. Check if user is a course team member or org admin
  const isTeam = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);
  if (isTeam) {
    return;
  }

  // 2. Find paths containing this course where the student is enrolled
  const enrolledPaths = await getPathsContainingCourseForMember(courseId, profileId, dbClient);
  if (enrolledPaths.length === 0) {
    // Student is not enrolled in any learning path that contains this course
    return;
  }

  // 3. Standalone grant bypass: if student has a non-learning-path grant, allow access
  const activeGrants = await getActiveGrantsForCourseAndProfile(courseId, profileId, dbClient);
  const hasStandaloneGrant = activeGrants.some((g) => g.source !== 'LEARNING_PATH');
  if (hasStandaloneGrant) {
    return;
  }

  // 4. Check if AT LEAST ONE enrolled path has this course unlocked
  let hasUnlockedAccess = false;

  for (const path of enrolledPaths) {
    if (!path.sequentialUnlock) {
      hasUnlockedAccess = true;
      break;
    }

    const courseIds = await getCourseIdsInPath(path.id, dbClient);
    const unlocked = await unlockedCourses({ sequentialUnlock: true, courseIds }, profileId, dbClient);
    if (unlocked.includes(courseId)) {
      hasUnlockedAccess = true;
      break;
    }
  }

  if (!hasUnlockedAccess) {
    throw new AppError('Course is locked — complete the previous course first', ErrorCodes.COURSE_LOCKED, 403);
  }
}

/**
 * Synchronizes the member course progress cache in `learning_path_member_course`
 * across all active learning paths containing this course for the student.
 * If the course was completed and a path has sequential unlock, unlocks the next course.
 * Also evaluates overall learning path completion and certificate issuance.
 */
export async function syncLearningPathProgressForMember(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  const enrolledPaths = await getPathsContainingCourseForMember(courseId, profileId, dbClient);
  if (enrolledPaths.length === 0) {
    return;
  }

  const stats = await getCourseCompletionStatsForProfile(courseId, profileId, dbClient);
  const totalItems = stats.totalLessons + stats.totalExercises;
  const completedItems = stats.completedLessons + stats.completedExercises;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
  const nowIso = new Date().toISOString();

  for (const path of enrolledPaths) {
    const member = await getMemberByPathAndProfile(path.id, profileId, dbClient);
    if (!member) continue;

    const pathCourses = await listLearningPathCourses(path.id, dbClient);
    const sortedPathCourses = [...pathCourses].sort((a, b) => a.order - b.order);
    const currentPathCourse = pathCourses.find((pc) => pc.courseId === courseId);
    if (!currentPathCourse) continue;

    const existingProgress = await getSingleMemberCourseProgress(member.id, currentPathCourse.id, dbClient);

    let isUnlocked = true;
    if (path.sequentialUnlock) {
      const unlockedCourseIds = await unlockedCourses(
        { sequentialUnlock: true, courseIds: sortedPathCourses.map((pc) => pc.courseId) },
        profileId,
        dbClient
      );
      isUnlocked = unlockedCourseIds.includes(courseId);
    }

    const status = stats.isComplete
      ? 'COMPLETED'
      : progressPercent > 0
        ? 'IN_PROGRESS'
        : isUnlocked
          ? 'NOT_STARTED'
          : 'LOCKED';

    const updatePayload: Parameters<typeof upsertMemberCourseProgress>[2] = {
      status,
      progressPercent,
      lessonsCompleted: stats.completedLessons,
      lessonsTotal: stats.totalLessons,
      exercisesCompleted: stats.completedExercises,
      exercisesTotal: stats.totalExercises
    };

    if (stats.isComplete) {
      updatePayload.completedAt = existingProgress?.completedAt ?? nowIso;
    } else {
      updatePayload.completedAt = null;
    }

    if (progressPercent > 0) {
      updatePayload.startedAt = existingProgress?.startedAt ?? nowIso;
    }

    if (isUnlocked) {
      updatePayload.unlockedAt = existingProgress?.unlockedAt ?? nowIso;
    } else {
      updatePayload.unlockedAt = null;
    }

    await upsertMemberCourseProgress(member.id, currentPathCourse.id, updatePayload, dbClient);

    if (stats.isComplete && path.sequentialUnlock) {
      const currentIndex = sortedPathCourses.findIndex((pc) => pc.id === currentPathCourse.id);
      if (currentIndex !== -1 && currentIndex + 1 < sortedPathCourses.length) {
        const nextPathCourse = sortedPathCourses[currentIndex + 1];
        const nextProgress = await getSingleMemberCourseProgress(member.id, nextPathCourse.id, dbClient);

        // Only transition if the course is currently LOCKED (or never initialized yet)
        if (!nextProgress || nextProgress.status === 'LOCKED') {
          await upsertMemberCourseProgress(
            member.id,
            nextPathCourse.id,
            {
              status: 'NOT_STARTED',
              unlockedAt: nextProgress?.unlockedAt ?? nowIso
            },
            dbClient
          );
        }
      }
    }

    await evaluatePathCompletion(path.id, profileId, dbClient);
  }
}
