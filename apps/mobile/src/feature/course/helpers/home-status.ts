import { daysUntil } from '@/feature/course/helpers/format-date';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import type { EnrolledCourse } from '@/feature/course/types/course';

const DUE_WINDOW_DAYS = 14;

export type HomeStatus =
  | { kind: 'overdue'; count: number }
  | { kind: 'due'; title: string; days: number }
  | { kind: 'in-progress'; count: number }
  | { kind: 'not-started'; count: number }
  | { kind: 'all-done' };

/** The one fact most worth a learner's attention: overdue requirements, then the nearest deadline, then what is left to do. */
export function homeStatusOf(courses: EnrolledCourse[], now = new Date()): HomeStatus | null {
  if (courses.length === 0) return null;

  const overdue = courses.filter(
    (course) => course.complianceStatus === 'non_compliant' || course.complianceStatus === 'in_grace_period'
  ).length;
  if (overdue > 0) return { kind: 'overdue', count: overdue };

  let nearest: { title: string; days: number } | null = null;
  for (const course of courses) {
    if (!course.complianceDueDate || learningStatusOf(course) === 'completed') continue;
    if (course.complianceStatus === 'compliant' || course.complianceStatus === 'waived') continue;

    const days = daysUntil(course.complianceDueDate, now);
    if (days < 0 || days > DUE_WINDOW_DAYS) continue;
    if (!nearest || days < nearest.days) nearest = { title: course.title, days };
  }
  if (nearest) return { kind: 'due', ...nearest };

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
