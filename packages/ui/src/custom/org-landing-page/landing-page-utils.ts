import type { CourseItem } from './types';

export function getPrimaryCourseTag(course: CourseItem) {
  return course.tags?.[0];
}

/** Plain copy for org landing templates (no dashboard i18n). */
export function formatExerciseCountLabel(count: number) {
  if (count === 1) return '1 exercise';
  return `${count} exercises`;
}

/** Mirrors dashboard `calcCourseDiscount` for landing-page course cards. */
export function calcCourseDiscount(percent = 0, cost: number, showDiscount: boolean) {
  if (!percent || !showDiscount) return cost;
  const discountAmount = (percent / 100) * cost;
  const discountedPrice = cost - discountAmount;
  return Math.round(discountedPrice);
}
