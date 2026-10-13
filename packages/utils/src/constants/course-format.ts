import type { TCourseType } from './course-type';

export const COURSE_FORMAT_VALUES = ['standard', 'single_activity'] as const;

export type TCourseFormat = (typeof COURSE_FORMAT_VALUES)[number];

export const SINGLE_ACTIVITY_COURSE_TYPES = ['SELF_PACED', 'COMPLIANCE'] as const;

export type TSingleActivityCourseType = (typeof SINGLE_ACTIVITY_COURSE_TYPES)[number];

/**
 * Whether a course type is allowed for a course format.
 */
export function isTypeAllowedForFormat(format: TCourseFormat | undefined, type: TCourseType): boolean {
  if (format === undefined || format === 'standard') return true;

  return (SINGLE_ACTIVITY_COURSE_TYPES as readonly string[]).includes(type);
}
