import {
  listLearningPathCourses,
  listPathMembershipsForCourse,
  listProfileCourseProgress,
  markLearningPathMemberCompleted,
  type TLearningPathCourseRow,
  type TProfileCourseProgressRow
} from '@cio/db/queries/learning-path/learning-path';
import { ROLE } from '@cio/utils/constants';
import {
  computeLearningPathUnlocks,
  learningPathProgressPercent,
  type LearningPathCourseUnlock
} from '@cio/utils/functions/learning-path';
import { AppError, ErrorCodes } from '@api/utils/errors';

export type LearnerPathCourse = {
  courseId: string;
  order: number;
  title: string;
  description: string | null;
  logo: string;
  bannerImage: string | null;
  slug: string | null;
  lessonCount: number;
  exerciseCount: number;
  isEnrolled: boolean;
  progressPercent: number;
  isComplete: boolean;
  isUnlocked: boolean;
  state: LearningPathCourseUnlock['state'];
  blockedBy: { courseId: string; title: string } | null;
};

export type LearnerPathProgress = {
  courses: LearnerPathCourse[];
  progressPercent: number;
  completedCourseCount: number;
  nextCourse: { courseId: string; title: string } | null;
};

export type PathLock = {
  pathId: string;
  pathName: string;
  blockingCourseId: string;
  blockingCourseTitle: string;
};

const notStartedProgress = (course: TLearningPathCourseRow): TProfileCourseProgressRow => ({
  profileId: '',
  courseId: course.courseId,
  groupMemberId: null,
  enrolledAt: null,
  completedAt: null,
  lessonsCount: course.lessonCount,
  lessonsCompleted: 0,
  exercisesCount: course.exerciseCount,
  exercisesCompleted: 0
});

/**
 * Per-course progress and unlock state for one learner. Only published courses take part in the
 * path order, since students cannot open the others.
 */
export function buildLearnerPathProgress(
  courses: TLearningPathCourseRow[],
  progressRows: TProfileCourseProgressRow[],
  sequentialUnlock: boolean
): LearnerPathProgress {
  const publishedCourses = courses.filter((course) => course.isPublished);
  const progressByCourseId = new Map(progressRows.map((row) => [row.courseId, row]));
  const unlocks = computeLearningPathUnlocks(
    publishedCourses.map((course) => progressByCourseId.get(course.courseId) ?? notStartedProgress(course)),
    sequentialUnlock
  );
  const titleByCourseId = new Map(publishedCourses.map((course) => [course.courseId, course.title]));

  const learnerCourses = publishedCourses.map((course, index) => {
    const unlock = unlocks[index];
    const blockedBy = unlock.blockedByCourseId
      ? { courseId: unlock.blockedByCourseId, title: titleByCourseId.get(unlock.blockedByCourseId) ?? '' }
      : null;

    return {
      courseId: course.courseId,
      order: index + 1,
      title: course.title,
      description: course.description,
      logo: course.logo,
      bannerImage: course.bannerImage,
      slug: course.slug,
      lessonCount: course.lessonCount,
      exerciseCount: course.exerciseCount,
      isEnrolled: Boolean(progressByCourseId.get(course.courseId)?.groupMemberId),
      progressPercent: unlock.progressPercent,
      isComplete: unlock.isComplete,
      isUnlocked: unlock.isUnlocked,
      state: unlock.state,
      blockedBy
    };
  });

  const next = learnerCourses.find((course) => course.isUnlocked && !course.isComplete) ?? null;

  return {
    courses: learnerCourses,
    progressPercent: learningPathProgressPercent(unlocks),
    completedCourseCount: unlocks.filter((unlock) => unlock.isComplete).length,
    nextCourse: next ? { courseId: next.courseId, title: next.title } : null
  };
}

export async function getLearnerPathProgress(
  pathId: string,
  profileId: string,
  sequentialUnlock: boolean
): Promise<LearnerPathProgress> {
  const courses = await listLearningPathCourses(pathId);
  const progressRows = await listProfileCourseProgress(
    [profileId],
    courses.map((course) => course.courseId)
  );

  return buildLearnerPathProgress(courses, progressRows, sequentialUnlock);
}

/**
 * Courses a sequential path keeps closed for one learner, keyed by course id. A course the learner joined on
 * their own before it became part of their path (before they joined the path, or before the course was added
 * to it) stays open.
 */
export function collectPathLocks(
  path: { pathId: string; pathName: string; sequentialUnlock: boolean; enrolledAt: string },
  progress: LearnerPathProgress,
  progressRows: TProfileCourseProgressRow[],
  courses: Pick<TLearningPathCourseRow, 'courseId' | 'addedAt'>[],
  locks: Map<string, PathLock> = new Map()
): Map<string, PathLock> {
  if (!path.sequentialUnlock) return locks;

  const enrolledAtByCourseId = new Map(progressRows.map((row) => [row.courseId, row.enrolledAt]));
  const addedAtByCourseId = new Map(courses.map((course) => [course.courseId, course.addedAt]));
  const pathEnrolledAt = new Date(path.enrolledAt).getTime();

  for (const course of progress.courses) {
    if (course.isUnlocked || !course.blockedBy || locks.has(course.courseId)) continue;

    const courseEnrolledAt = enrolledAtByCourseId.get(course.courseId);
    const addedAt = addedAtByCourseId.get(course.courseId);
    const partOfPathSince = Math.max(pathEnrolledAt, addedAt ? new Date(addedAt).getTime() : 0);
    const joinedIndependently = courseEnrolledAt ? new Date(courseEnrolledAt).getTime() < partOfPathSince : false;
    if (joinedIndependently) continue;

    locks.set(course.courseId, {
      pathId: path.pathId,
      pathName: path.pathName,
      blockingCourseId: course.blockedBy.courseId,
      blockingCourseTitle: course.blockedBy.title
    });
  }

  return locks;
}

/** The sequential path that keeps `courseId` closed for this learner, if any. */
export async function getCoursePathLock(courseId: string, profileId: string): Promise<PathLock | null> {
  const memberships = (await listPathMembershipsForCourse(courseId, profileId)).filter(
    (membership) => membership.sequentialUnlock
  );

  for (const membership of memberships) {
    const courses = await listLearningPathCourses(membership.pathId);
    const progressRows = await listProfileCourseProgress(
      [profileId],
      courses.map((course) => course.courseId)
    );
    const progress = buildLearnerPathProgress(courses, progressRows, true);
    const lock = collectPathLocks(membership, progress, progressRows, courses).get(courseId);
    if (lock) return lock;
  }

  return null;
}

/** Throws `LEARNING_PATH_COURSE_LOCKED` when a student opens content of a course their path keeps locked. */
export async function assertCourseNotPathLocked(params: {
  courseId: string;
  profileId: string;
  roleId: number | null;
}): Promise<void> {
  if (params.roleId !== ROLE.STUDENT) return;

  const lock = await getCoursePathLock(params.courseId, params.profileId);
  if (!lock) return;

  throw new AppError(
    `Finish ${lock.blockingCourseTitle} to unlock this course`,
    ErrorCodes.LEARNING_PATH_COURSE_LOCKED,
    403
  );
}

/** Marks every path containing `courseId` complete for the learner once all of its published courses are. */
export async function evaluateLearningPathCompletion(courseId: string, profileId: string): Promise<void> {
  const memberships = await listPathMembershipsForCourse(courseId, profileId);

  for (const membership of memberships) {
    if (membership.completedAt) continue;

    const progress = await getLearnerPathProgress(membership.pathId, profileId, false);
    const allComplete = progress.courses.length > 0 && progress.courses.every((course) => course.isComplete);
    if (!allComplete) continue;

    await markLearningPathMemberCompleted(membership.memberId, new Date().toISOString());
  }
}
