import { daysUntil } from '@/feature/course/helpers/format-date';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import type { EnrolledCourse } from '@/feature/course/types/course';
import type { HomeDigest } from '@/feature/course/types/home-digest';

export type HomeStatus =
  | { kind: 'overdue'; count: number }
  | { kind: 'due'; title: string; days: number }
  | { kind: 'in-progress'; count: number }
  | { kind: 'not-started'; count: number }
  | { kind: 'all-done' };

/**
 * The one fact most worth a learner's attention: the server's overdue count, then its nearest deadline, then what is
 * left to do across the learner's courses.
 */
export function homeStatusOf(
  courses: EnrolledCourse[],
  digest: HomeDigest | undefined,
  now = new Date()
): HomeStatus | null {
  if (courses.length === 0) return null;

  if (digest && digest.overdueCount > 0) return { kind: 'overdue', count: digest.overdueCount };

  const nearest = digest?.dueSoon[0];
  if (nearest) return { kind: 'due', title: nearest.courseTitle, days: Math.max(0, daysUntil(nearest.dueDate, now)) };

  const inProgress = courses.filter((course) => learningStatusOf(course) === 'in-progress').length;
  if (inProgress > 0) return { kind: 'in-progress', count: inProgress };

  const notStarted = courses.filter((course) => learningStatusOf(course) === 'not-started').length;
  if (notStarted > 0) return { kind: 'not-started', count: notStarted };

  return { kind: 'all-done' };
}

export type DayPart = 'morning' | 'afternoon' | 'evening';

export function dayPartOf(now = new Date()): DayPart {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';

  return 'evening';
}

export function firstNameOf(fullname: string | null | undefined) {
  return fullname?.trim().split(/\s+/)[0] || null;
}
