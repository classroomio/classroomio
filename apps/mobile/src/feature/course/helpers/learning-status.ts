import type { EnrolledCourse, LearningStatus } from '@/feature/course/types/course';

type CourseProgress = Pick<EnrolledCourse, 'progressRate' | 'lessonCount'>;

/** Percentage of lessons completed; the API reports `progressRate` as a count of completed lessons. */
export function progressPercentOf(course: CourseProgress) {
  const completed = course.progressRate ?? 0;
  const total = course.lessonCount ?? 0;
  if (total <= 0 || completed <= 0) return 0;

  return Math.min(100, Math.round((completed / total) * 100));
}

export function learningStatusOf(course: CourseProgress): LearningStatus {
  const percent = progressPercentOf(course);
  if (percent >= 100) return 'completed';
  if (percent > 0) return 'in-progress';

  return 'not-started';
}

/** The started, unfinished course with the most progress, which is the one a learner most likely wants to resume. */
export function courseToResume(courses: EnrolledCourse[]) {
  return courses
    .filter((course) => learningStatusOf(course) === 'in-progress')
    .reduce<EnrolledCourse | null>(
      (best, course) => (best === null || progressPercentOf(course) > progressPercentOf(best) ? course : best),
      null
    );
}
