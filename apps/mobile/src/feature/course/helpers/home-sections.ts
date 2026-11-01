import { liveSessionPhaseOf } from '@/feature/course/helpers/content-copy';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { daysUntil } from '@/feature/course/helpers/format-date';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import type { EnrolledCourse } from '@/feature/course/types/course';

const DUE_SOON_WINDOW_DAYS = 30;
const DUE_SOON_LIMIT = 3;

type UpcomingSession = NonNullable<EnrolledCourse['upcomingSession']>;

export type NextLiveClass = { course: EnrolledCourse; session: UpcomingSession; live: boolean };

/**
 * The live class happening now, or else the soonest one ahead, across the learner's courses. The enrolled-courses
 * response carries no session length, so "happening now" assumes the default session duration.
 */
export function nextLiveClassOf(courses: EnrolledCourse[]): NextLiveClass | null {
  let next: NextLiveClass | null = null;

  for (const course of courses) {
    const session = course.upcomingSession;
    if (!session) continue;

    const phase = liveSessionPhaseOf({
      callUrl: session.callUrl,
      lessonAt: session.lessonAt,
      sessionDurationMinutes: null
    });
    if (phase !== 'live' && phase !== 'upcoming') continue;

    const candidate = { course, session, live: phase === 'live' };
    if (
      !next ||
      (candidate.live && !next.live) ||
      (candidate.live === next.live && parseTimestamp(session.lessonAt) < parseTimestamp(next.session.lessonAt))
    ) {
      next = candidate;
    }
  }

  return next;
}

export type DueSoonItem = { course: EnrolledCourse; days: number };

/** Up to three required courses still to finish whose deadline falls in the next 30 days, nearest first. */
export function dueSoonOf(courses: EnrolledCourse[], now = new Date()): DueSoonItem[] {
  return courses
    .filter(
      (course) =>
        course.complianceDueDate &&
        learningStatusOf(course) !== 'completed' &&
        course.complianceStatus !== 'compliant' &&
        course.complianceStatus !== 'waived'
    )
    .map((course) => ({ course, days: daysUntil(course.complianceDueDate!, now) }))
    .filter((item) => item.days >= 0 && item.days <= DUE_SOON_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)
    .slice(0, DUE_SOON_LIMIT);
}
