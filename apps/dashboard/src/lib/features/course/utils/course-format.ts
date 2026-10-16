import type { Course } from './types';

export function isSingleActivityCourse(
  course: Pick<Course, 'format'> | { format?: string | null } | null | undefined
): boolean {
  return course?.format === 'single_activity';
}
