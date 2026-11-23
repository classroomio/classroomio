import type { NotifyInput } from '@cio/core/services/notification/notify';
import type { LearnerProgressRow } from '@cio/db/queries/teaching/learner-progress';
import type { StaffSessionRow } from '@cio/db/queries/teaching/sessions';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How often the learner attention scan runs. Each run announces the stalls flagged during the previous interval. */
export const LEARNER_ATTENTION_SCAN_INTERVAL_MS = 6 * 60 * 60 * 1_000;

/** The session's host when one is set, otherwise the course's tutors. */
function sessionRecipients(session: StaffSessionRow, tutorsByCourse: Map<string, string[]>): string[] {
  if (session.hostProfileId) return [session.hostProfileId];

  return tutorsByCourse.get(session.courseId) ?? [];
}

/**
 * One notification per session for its host or tutors. The key includes the start time, so a rescheduled session is
 * announced again while repeated scans of the same session add nothing.
 */
export function planSessionNotifications(
  type: 'live_session_host_reminder' | 'attendance_reminder',
  sessions: StaffSessionRow[],
  tutorsByCourse: Map<string, string[]>
): NotifyInput[] {
  return sessions
    .map((session) => ({
      organizationId: session.organizationId,
      recipientProfileIds: sessionRecipients(session, tutorsByCourse),
      type,
      entityId: session.lessonId,
      courseId: session.courseId,
      dedupeKey: `${type}:${session.lessonId}:${new Date(session.lessonAt).toISOString()}`
    }))
    .filter((input) => input.recipientProfileIds.length > 0);
}

function stalledSince(row: LearnerProgressRow): string | null {
  if (row.nudgeReason === 'failed_quiz') return row.failedAt;

  return row.lastActivityAt ?? row.enrolledAt;
}

function flaggedAt(row: LearnerProgressRow, inactiveDays: number): number | null {
  const since = stalledSince(row);
  if (!since) return null;

  return new Date(since).getTime() + (row.nudgeReason === 'inactive' ? inactiveDays * DAY_MS : 0);
}

/**
 * One notification per course for its tutors, counting the learners who crossed the Needs a nudge threshold during
 * the interval before the current scan window. A rerun inside the same window builds the same key, so it adds
 * nothing; older stalls stay visible in the app's Needs a nudge filter. With a single learner, the notification
 * names them.
 */
export function planLearnerAttentionNotifications(params: {
  rows: LearnerProgressRow[];
  organizationByCourse: Map<string, string>;
  tutorsByCourse: Map<string, string[]>;
  inactiveDays: number;
  now: Date;
  intervalMs?: number;
}): NotifyInput[] {
  const intervalMs = params.intervalMs ?? LEARNER_ATTENTION_SCAN_INTERVAL_MS;
  const windowIndex = Math.floor(params.now.getTime() / intervalMs);
  const windowEnd = windowIndex * intervalMs;
  const windowStart = windowEnd - intervalMs;
  const learnersByCourse = new Map<string, Set<string>>();

  for (const row of params.rows) {
    if (!row.needsNudge || !row.nudgeReason) continue;

    const flagged = flaggedAt(row, params.inactiveDays);
    if (flagged === null || flagged < windowStart || flagged >= windowEnd) continue;

    learnersByCourse.set(row.courseId, (learnersByCourse.get(row.courseId) ?? new Set()).add(row.profileId));
  }

  const inputs: NotifyInput[] = [];

  for (const [courseId, learners] of learnersByCourse) {
    const organizationId = params.organizationByCourse.get(courseId);
    const tutors = params.tutorsByCourse.get(courseId) ?? [];
    if (!organizationId || tutors.length === 0) continue;

    const [onlyLearner] = learners.size === 1 ? [...learners] : [null];

    inputs.push({
      organizationId,
      recipientProfileIds: tutors,
      type: 'learner_needs_nudge',
      entityId: courseId,
      courseId,
      actorProfileId: onlyLearner,
      itemCount: learners.size,
      dedupeKey: `learner_needs_nudge:${courseId}:${windowIndex}`
    });
  }

  return inputs;
}
