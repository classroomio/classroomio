import type { LearnerComplianceRequirement } from '@api/services/course/compliance';
import type { TStudentCourse } from '@cio/db/queries/course/course';

export const HOME_DIGEST_DUE_WINDOW_DAYS = 30;
export const HOME_DIGEST_DUE_SOON_LIMIT = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const SETTLED_STATUSES = new Set(['compliant', 'waived', 'expiring_soon']);
const OVERDUE_STATUSES = new Set(['non_compliant', 'in_grace_period']);

export type HomeDigestDueItem = {
  courseId: string;
  courseTitle: string;
  bannerImage: string | null;
  isMandatory: boolean;
  dueDate: string;
  daysUntilDue: number;
  progressPercent: number;
};

export type HomeDigestLiveClass = {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  callUrl: string;
  lessonAt: string;
  durationMinutes: number;
  isLive: boolean;
};

/** Whole days from `now` to `date`, rounded up, so anything later today is 0 and tomorrow is 1. */
export function daysUntil(date: Date, now: Date): number {
  return Math.ceil((date.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Unfinished compliance requirements whose current cycle is due between now and the window end, nearest first,
 * capped at `limit`.
 */
export function selectDueSoon(
  requirements: LearnerComplianceRequirement[],
  now: Date,
  limit = HOME_DIGEST_DUE_SOON_LIMIT
): HomeDigestDueItem[] {
  const windowEnd = now.getTime() + HOME_DIGEST_DUE_WINDOW_DAYS * MS_PER_DAY;

  return requirements
    .filter((requirement) => {
      if (!requirement.dueDate || requirement.completedAt) return false;
      if (SETTLED_STATUSES.has(requirement.status) || OVERDUE_STATUSES.has(requirement.status)) return false;

      const dueAt = new Date(requirement.dueDate).getTime();

      return dueAt >= now.getTime() && dueAt <= windowEnd;
    })
    .sort((left, right) => new Date(left.dueDate!).getTime() - new Date(right.dueDate!).getTime())
    .slice(0, limit)
    .map((requirement) => {
      const dueDate = requirement.dueDate!;

      return {
        courseId: requirement.courseId,
        courseTitle: requirement.courseTitle,
        bannerImage: requirement.courseImage,
        isMandatory: requirement.isMandatory,
        dueDate,
        daysUntilDue: daysUntil(new Date(dueDate), now),
        progressPercent: requirement.progressPercent
      };
    });
}

export function countOverdue(requirements: LearnerComplianceRequirement[]): number {
  return requirements.filter((requirement) => OVERDUE_STATUSES.has(requirement.status)).length;
}

/** The session running now, else the soonest upcoming one, across the learner's live class courses. */
export function selectNextLiveClass(courses: TStudentCourse[], now: Date): HomeDigestLiveClass | null {
  const sessions = courses.flatMap((course) => {
    const session = course.upcomingSession;
    if (!session) return [];

    const startsAt = new Date(session.lessonAt).getTime();
    const endsAt = startsAt + session.durationMinutes * MS_PER_MINUTE;
    if (endsAt <= now.getTime()) return [];

    return [
      {
        courseId: course.id,
        courseTitle: course.title,
        lessonId: session.lessonId,
        lessonTitle: session.lessonTitle,
        callUrl: session.callUrl,
        lessonAt: new Date(session.lessonAt).toISOString(),
        durationMinutes: session.durationMinutes,
        isLive: startsAt <= now.getTime()
      }
    ];
  });

  const [next] = sessions.sort((left, right) => {
    if (left.isLive !== right.isLive) return left.isLive ? -1 : 1;

    return new Date(left.lessonAt).getTime() - new Date(right.lessonAt).getTime();
  });

  return next ?? null;
}
