export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export type TCourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_DURATION_BUCKETS = ['short', 'medium', 'long'] as const;

export type TCourseDurationBucket = (typeof COURSE_DURATION_BUCKETS)[number];

/** Upper bounds in minutes: short is under an hour, medium one to three hours, long anything longer. */
export const COURSE_DURATION_BUCKET_MAX_MINUTES = { short: 60, medium: 180 } as const;

export const MAX_COURSE_DURATION_MINUTES = 100_000;

export function courseDurationBucketOf(minutes: number | null): TCourseDurationBucket | null {
  if (minutes === null || minutes <= 0) return null;
  if (minutes < COURSE_DURATION_BUCKET_MAX_MINUTES.short) return 'short';
  if (minutes <= COURSE_DURATION_BUCKET_MAX_MINUTES.medium) return 'medium';

  return 'long';
}
