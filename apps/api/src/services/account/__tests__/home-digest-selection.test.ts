import { describe, expect, it } from 'vitest';

import type { LearnerComplianceRequirement } from '@api/services/course/compliance';
import type { TStudentCourse } from '@cio/db/queries/course/course';

import { countOverdue, selectDueSoon, selectNextLiveClass } from '../home-digest-selection';

const now = new Date('2026-11-01T12:00:00.000Z');

function requirement(overrides: Partial<LearnerComplianceRequirement>): LearnerComplianceRequirement {
  return {
    courseId: 'course-1',
    courseTitle: 'Course',
    courseImage: null,
    framework: null,
    isMandatory: true,
    retakeIntervalMonths: 0,
    gracePeriodDays: 0,
    standing: 'open',
    status: 'not_started',
    cycleNumber: 1,
    dueDate: '2026-11-10T12:00:00.000Z',
    gracePeriodEndsAt: null,
    completedAt: null,
    validUntil: null,
    lastCompletedAt: null,
    score: null,
    progressPercent: 0,
    waiver: null,
    certificate: null,
    ...overrides
  } as LearnerComplianceRequirement;
}

function liveCourse(id: string, lessonAt: string | null, durationMinutes = 60): TStudentCourse {
  return {
    id,
    title: `Course ${id}`,
    upcomingSession: lessonAt
      ? {
          lessonId: `lesson-${id}`,
          lessonTitle: `Lesson ${id}`,
          callUrl: 'https://meet.example/abc',
          lessonAt,
          durationMinutes,
          sessionTimezone: null
        }
      : null
  } as TStudentCourse;
}

describe('selectDueSoon', () => {
  it('keeps unfinished requirements due within 30 days, nearest first, capped at three', () => {
    const items = selectDueSoon(
      [
        requirement({ courseId: 'later', dueDate: '2026-11-20T12:00:00.000Z' }),
        requirement({ courseId: 'soonest', dueDate: '2026-11-02T12:00:00.000Z' }),
        requirement({ courseId: 'middle', dueDate: '2026-11-05T12:00:00.000Z' }),
        requirement({ courseId: 'fourth', dueDate: '2026-11-25T12:00:00.000Z' }),
        requirement({ courseId: 'too-far', dueDate: '2026-12-15T12:00:00.000Z' })
      ],
      now
    );

    expect(items.map((item) => item.courseId)).toEqual(['soonest', 'middle', 'later']);
    expect(items[0]?.daysUntilDue).toBe(1);
  });

  it('skips compliant, waived, completed, past-due and undated requirements', () => {
    const items = selectDueSoon(
      [
        requirement({ courseId: 'compliant', status: 'compliant' }),
        requirement({ courseId: 'waived', status: 'waived' }),
        requirement({ courseId: 'done', completedAt: '2026-10-30T12:00:00.000Z' }),
        requirement({ courseId: 'past', dueDate: '2026-10-30T12:00:00.000Z' }),
        requirement({ courseId: 'undated', dueDate: null })
      ],
      now
    );

    expect(items).toEqual([]);
  });
});

describe('countOverdue', () => {
  it('counts non-compliant and grace-period requirements', () => {
    expect(
      countOverdue([
        requirement({ status: 'non_compliant' }),
        requirement({ status: 'in_grace_period' }),
        requirement({ status: 'compliant' })
      ])
    ).toBe(2);
  });
});

describe('selectNextLiveClass', () => {
  it('prefers a session running now over a sooner upcoming one', () => {
    const next = selectNextLiveClass(
      [liveCourse('upcoming', '2026-11-01T12:30:00.000Z'), liveCourse('running', '2026-11-01T11:30:00.000Z', 90)],
      now
    );

    expect(next?.courseId).toBe('running');
    expect(next?.isLive).toBe(true);
  });

  it('picks the soonest upcoming session and ignores finished ones', () => {
    const next = selectNextLiveClass(
      [
        liveCourse('finished', '2026-11-01T10:00:00.000Z', 30),
        liveCourse('later', '2026-11-03T09:00:00.000Z'),
        liveCourse('sooner', '2026-11-02T09:00:00.000Z'),
        liveCourse('none', null)
      ],
      now
    );

    expect(next?.courseId).toBe('sooner');
    expect(next?.isLive).toBe(false);
  });

  it('returns null when nothing is scheduled', () => {
    expect(selectNextLiveClass([liveCourse('none', null)], now)).toBeNull();
  });
});
