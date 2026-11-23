export type LearningPathCourseState = 'completed' | 'in_progress' | 'not_started' | 'locked';

export type LearningPathCourseProgressInput = {
  courseId: string;
  lessonsCount: number;
  lessonsCompleted: number;
  exercisesCount: number;
  exercisesCompleted: number;
  completedAt: string | null;
};

export type LearningPathCourseUnlock = {
  courseId: string;
  progressPercent: number;
  isComplete: boolean;
  isUnlocked: boolean;
  state: LearningPathCourseState;
  blockedByCourseId: string | null;
};

/**
 * A course counts as complete for a path when every lesson is complete and every exercise is
 * completed, or when the course itself recorded completion.
 */
export function isLearningPathCourseComplete(progress: LearningPathCourseProgressInput): boolean {
  if (progress.completedAt) return true;

  const total = progress.lessonsCount + progress.exercisesCount;
  const done = progress.lessonsCompleted + progress.exercisesCompleted;

  return done >= total;
}

export function learningPathCourseProgressPercent(progress: LearningPathCourseProgressInput): number {
  const total = progress.lessonsCount + progress.exercisesCount;
  if (total === 0) return progress.completedAt ? 100 : 0;

  const done = Math.min(total, progress.lessonsCompleted + progress.exercisesCompleted);

  return Math.round((done / total) * 100);
}

/**
 * Unlock states for a path's courses in path order. With `sequentialUnlock`, every course after the
 * first incomplete one is locked and blocked by that course.
 */
export function computeLearningPathUnlocks(
  courses: LearningPathCourseProgressInput[],
  sequentialUnlock: boolean
): LearningPathCourseUnlock[] {
  let blockingCourseId: string | null = null;

  return courses.map((course) => {
    const isComplete = isLearningPathCourseComplete(course);
    const progressPercent = isComplete ? 100 : learningPathCourseProgressPercent(course);
    const isUnlocked = !sequentialUnlock || blockingCourseId === null;
    const blockedByCourseId = isUnlocked ? null : blockingCourseId;

    if (!isComplete && blockingCourseId === null) {
      blockingCourseId = course.courseId;
    }

    let state: LearningPathCourseState = 'not_started';
    if (!isUnlocked) state = 'locked';
    else if (isComplete) state = 'completed';
    else if (progressPercent > 0) state = 'in_progress';

    return { courseId: course.courseId, progressPercent, isComplete, isUnlocked, state, blockedByCourseId };
  });
}

/** Path progress: the share of courses complete, as a whole percent. */
export function learningPathProgressPercent(unlocks: LearningPathCourseUnlock[]): number {
  if (unlocks.length === 0) return 0;

  const completed = unlocks.filter((course) => course.isComplete).length;

  return Math.round((completed / unlocks.length) * 100);
}
