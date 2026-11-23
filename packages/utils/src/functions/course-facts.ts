import { COURSE_LEVELS, type TCourseLevel } from '../constants/course-level';

type CourseFactsMetadata = {
  level?: string | null;
  durationMinutes?: number | null;
  instructor?: { name?: string | null } | null;
} | null;

export type CourseFacts = {
  level: TCourseLevel | null;
  durationMinutes: number | null;
  instructorName: string | null;
};

function isCourseLevel(value: unknown): value is TCourseLevel {
  return typeof value === 'string' && (COURSE_LEVELS as readonly string[]).includes(value);
}

/**
 * Level, length and instructor learners see for a course: the teacher-set values first, then the sum of known lesson
 * video lengths for the duration and the first tutor for the instructor.
 */
export function resolveCourseFacts(
  metadata: CourseFactsMetadata | undefined,
  videoSeconds: number | null,
  tutorName: string | null
): CourseFacts {
  const setMinutes = metadata?.durationMinutes;
  const videoMinutes = videoSeconds && videoSeconds > 0 ? Math.max(1, Math.round(videoSeconds / 60)) : null;
  const instructorName = metadata?.instructor?.name?.trim() || tutorName?.trim() || null;

  return {
    level: isCourseLevel(metadata?.level) ? metadata.level : null,
    durationMinutes: typeof setMinutes === 'number' && setMinutes > 0 ? setMinutes : videoMinutes,
    instructorName
  };
}
