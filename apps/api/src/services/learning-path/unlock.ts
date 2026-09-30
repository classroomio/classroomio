import { AppError, ErrorCodes } from '@api/utils/errors';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  getCourseIdsInPath,
  getPathsContainingCourseForMember,
  hasLiveNonPathGrant
} from '@cio/db/queries/learning-path';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { unlockedCourses } from '@cio/core/services/learning-path/progress-sync';

// Progress sync lives in core so the worker runs the same code; re-exported for API callers.
export {
  courseCompleteForPath,
  evaluatePathCompletion,
  syncCourseProgressInLearningPaths,
  syncPathProgressForMember,
  unlockedCourses,
  type TPathCompletionResult,
  type TProgressSyncOptions
} from '@cio/core/services/learning-path/progress-sync';

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
  const isTeam = await isCourseTeamMemberOrOrgAdmin(courseId, profileId, dbClient);
  if (isTeam) {
    return;
  }

  // 2. Find paths containing this course where the student is enrolled
  const enrolledPaths = await getPathsContainingCourseForMember(courseId, profileId, dbClient);
  if (enrolledPaths.length === 0) {
    // Student is not enrolled in any learning path that contains this course
    return;
  }

  // 3. Standalone grant bypass: any live non-learning-path grant (self-enroll,
  // invite, cohort, import, …) is an independent enrollment, so it is not
  // gated by another path's sequential unlock. A cohort learner who also
  // joined a path keeps cohort access regardless of path progress.
  const hasStandaloneGrant = await hasLiveNonPathGrant(courseId, profileId, dbClient);
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
