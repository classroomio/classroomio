import { describe, expect, it } from 'vitest';

import type { LearnerProgressRow } from '@cio/db/queries/teaching/learner-progress';
import type { StaffSessionRow } from '@cio/db/queries/teaching/sessions';

import { planLearnerAttentionNotifications, planSessionNotifications } from './staff-scan-plan';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-11-16T12:00:00.000Z');

function session(overrides: Partial<StaffSessionRow> = {}): StaffSessionRow {
  return {
    lessonId: 'lesson-1',
    courseId: 'course-1',
    organizationId: 'org-1',
    hostProfileId: null,
    lessonAt: '2026-11-16T12:40:00.000Z',
    ...overrides
  };
}

function learner(overrides: Partial<LearnerProgressRow> = {}): LearnerProgressRow {
  return {
    courseId: 'course-1',
    courseTitle: 'Course',
    groupMemberId: 'member-1',
    profileId: 'learner-1',
    fullname: 'Learner',
    username: null,
    email: null,
    avatarUrl: null,
    enrolledAt: '2026-10-01T09:00:00.000Z',
    completedAt: null,
    progressPercent: 40,
    lastActivityAt: new Date(NOW.getTime() - 8 * DAY_MS).toISOString(),
    needsNudge: true,
    nudgeReason: 'inactive',
    failedExerciseId: null,
    failedExerciseTitle: null,
    failedAt: null,
    lastNudgedAt: null,
    ...overrides
  };
}

const tutorsByCourse = new Map([['course-1', ['tutor-1', 'tutor-2']]]);
const organizationByCourse = new Map([['course-1', 'org-1']]);

describe('planSessionNotifications', () => {
  it('sends to the host when the session has one, otherwise to the course tutors', () => {
    const [hosted, unhosted] = planSessionNotifications(
      'live_session_host_reminder',
      [session({ hostProfileId: 'host-1' }), session({ lessonId: 'lesson-2' })],
      tutorsByCourse
    );

    expect(hosted?.recipientProfileIds).toEqual(['host-1']);
    expect(unhosted?.recipientProfileIds).toEqual(['tutor-1', 'tutor-2']);
  });

  it('produces the same keys on every scan, and a new key when the session moves', () => {
    const first = planSessionNotifications('attendance_reminder', [session()], tutorsByCourse);
    const second = planSessionNotifications('attendance_reminder', [session()], tutorsByCourse);
    const moved = planSessionNotifications(
      'attendance_reminder',
      [session({ lessonAt: '2026-11-17T12:40:00.000Z' })],
      tutorsByCourse
    );

    expect(first).toEqual(second);
    expect(first[0]?.dedupeKey).toBe('attendance_reminder:lesson-1:2026-11-16T12:40:00.000Z');
    expect(moved[0]?.dedupeKey).not.toBe(first[0]?.dedupeKey);
  });

  it('skips sessions with nobody to tell', () => {
    expect(
      planSessionNotifications('attendance_reminder', [session({ courseId: 'course-9' })], tutorsByCourse)
    ).toEqual([]);
  });
});

describe('planLearnerAttentionNotifications', () => {
  const HOUR_MS = 60 * 60 * 1000;
  const plan = (rows: LearnerProgressRow[], now: Date = NOW) =>
    planLearnerAttentionNotifications({ rows, organizationByCourse, tutorsByCourse, inactiveDays: 7, now });
  const quietSince = (hoursBeforeFlag: number) =>
    new Date(NOW.getTime() - 7 * DAY_MS - hoursBeforeFlag * HOUR_MS).toISOString();

  it('sends one notification per course for the learners flagged in the previous window', () => {
    const inputs = plan([
      learner({ profileId: 'learner-1', lastActivityAt: quietSince(1) }),
      learner({ profileId: 'learner-2', groupMemberId: 'member-2', lastActivityAt: quietSince(3) }),
      learner({
        profileId: 'learner-3',
        groupMemberId: 'member-3',
        nudgeReason: 'failed_quiz',
        failedExerciseId: 'exercise-1',
        failedAt: new Date(NOW.getTime() - 2 * HOUR_MS).toISOString()
      })
    ]);

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      organizationId: 'org-1',
      recipientProfileIds: ['tutor-1', 'tutor-2'],
      type: 'learner_needs_nudge',
      entityId: 'course-1',
      courseId: 'course-1',
      actorProfileId: null,
      itemCount: 3
    });
  });

  it('names the learner when only one was flagged', () => {
    const [input] = plan([learner({ lastActivityAt: quietSince(1) })]);

    expect(input).toMatchObject({ actorProfileId: 'learner-1', itemCount: 1 });
  });

  it('builds the same key for every scan in a window, and a new key in the next window', () => {
    const row = learner({ lastActivityAt: quietSince(1) });
    const sameWindow = plan([row], new Date(NOW.getTime() + HOUR_MS));
    const nextWindow = plan([row], new Date(NOW.getTime() + 6 * HOUR_MS));

    expect(sameWindow).toEqual(plan([row]));
    expect(nextWindow).toEqual([]);
  });

  it('does not announce stalls flagged before the previous window', () => {
    const longQuiet = learner({ lastActivityAt: new Date(NOW.getTime() - 30 * DAY_MS).toISOString() });
    const oldFailure = learner({
      nudgeReason: 'failed_quiz',
      failedExerciseId: 'exercise-1',
      failedAt: new Date(NOW.getTime() - 20 * DAY_MS).toISOString()
    });

    expect(plan([longQuiet, oldFailure])).toEqual([]);
  });

  it('falls back to the enrollment date for a learner who never started', () => {
    const neverStarted = learner({ lastActivityAt: null, enrolledAt: quietSince(2) });

    expect(plan([neverStarted])[0]?.actorProfileId).toBe('learner-1');
  });

  it('skips rows that are not flagged or whose course has no tutors', () => {
    expect(
      plan([
        learner({ needsNudge: false, nudgeReason: null, lastActivityAt: quietSince(1) }),
        learner({ courseId: 'course-9', lastActivityAt: quietSince(1) })
      ])
    ).toEqual([]);
  });
});
