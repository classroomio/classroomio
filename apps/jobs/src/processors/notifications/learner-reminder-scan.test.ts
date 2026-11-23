import { beforeEach, describe, expect, it, vi } from 'vitest';

const listRegisteredLearnersStartingBetween = vi.fn();
const listDueExerciseStudentsWithoutSubmission = vi.fn();
const listLearnerGoalTimezones = vi.fn();
const listLearnerGoalsInTimezones = vi.fn();
const listLearnerActivity = vi.fn();
const delivered = new Set<string>();
const listExistingDedupeKeys = vi.fn(async (profileIds: string[], keys: string[]) => {
  const existing = new Set<string>();
  for (const profileId of profileIds) {
    for (const key of keys) {
      if (delivered.has(`${profileId}:${key}`)) existing.add(key);
    }
  }

  return existing;
});

const notify = vi.fn(
  async (input: { recipientProfileIds: string[]; dedupeKey?: string; type: string; entityId: string }) => {
    const notificationIds: string[] = [];
    for (const profileId of input.recipientProfileIds) {
      const key = `${profileId}:${input.dedupeKey}`;
      if (delivered.has(key)) continue;

      delivered.add(key);
      notificationIds.push(`${input.type}:${key}`);
    }

    return { notificationIds, pushJobId: null };
  }
);

vi.mock('@cio/db/queries/learner/live-classes', () => ({ listRegisteredLearnersStartingBetween }));
vi.mock('@cio/db/queries/learner/recipients', () => ({ listDueExerciseStudentsWithoutSubmission }));
vi.mock('@cio/db/queries/notifications/notification', () => ({ listExistingDedupeKeys }));
vi.mock('@cio/db/queries/learner/goals', () => ({
  listLearnerGoalTimezones,
  listLearnerGoalsInTimezones,
  listLearnerActivity,
  getLearnerGoal: vi.fn(),
  upsertLearnerGoal: vi.fn()
}));
vi.mock('@cio/core/services/notification/notify', () => ({ notify }));
vi.mock('../../utils/logger', () => ({ log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

const {
  liveClassReminderDedupeKey,
  planLiveClassReminders,
  processLearnerReminderScan,
  selectStreakReminderTimezones
} = await import('./learner-reminder-scan');

// 2024-01-03 is a Wednesday; 2024-01-06 is a Saturday.
const NOW = new Date('2024-01-03T12:00:00Z');

function registered(lessonId: string, minutesFromNow: number, profileId: string) {
  return {
    lessonId,
    lessonAt: new Date(NOW.getTime() + minutesFromNow * 60_000).toISOString(),
    profileId,
    courseId: `course-${lessonId}`,
    organizationId: 'org-1'
  };
}

function goal(id: string, timezone: string | null) {
  return {
    id,
    profileId: `profile-${id}`,
    organizationId: 'org-1',
    weeklyLessonTarget: 3,
    timezone,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString()
  };
}

beforeEach(() => {
  delivered.clear();
  vi.clearAllMocks();
  listRegisteredLearnersStartingBetween.mockResolvedValue([]);
  listDueExerciseStudentsWithoutSubmission.mockResolvedValue([]);
  listLearnerGoalTimezones.mockResolvedValue([]);
  listLearnerGoalsInTimezones.mockResolvedValue([]);
  listLearnerActivity.mockResolvedValue([]);
});

describe('planLiveClassReminders', () => {
  it('sends the hour-before reminder within the hour and the start reminder at the start', () => {
    const plan = planLiveClassReminders(
      [
        registered('soon', 50, 'a'),
        registered('soon', 50, 'b'),
        registered('starting', 3, 'a'),
        registered('started', -5, 'a'),
        registered('long-started', -15, 'a'),
        registered('later', 90, 'a')
      ],
      NOW
    );

    expect(plan).toEqual([
      { lessonId: 'soon', courseId: 'course-soon', organizationId: 'org-1', offsetMinutes: 60, profileIds: ['a', 'b'] },
      {
        lessonId: 'starting',
        courseId: 'course-starting',
        organizationId: 'org-1',
        offsetMinutes: 0,
        profileIds: ['a']
      },
      { lessonId: 'started', courseId: 'course-started', organizationId: 'org-1', offsetMinutes: 0, profileIds: ['a'] }
    ]);
  });

  it('shares the hour-before key with the course session reminder', () => {
    expect(liveClassReminderDedupeKey({ lessonId: 'l1', offsetMinutes: 60 })).toBe('live_session_reminder:l1:60');
    expect(liveClassReminderDedupeKey({ lessonId: 'l1', offsetMinutes: 0 })).toBe('live_class_starting:l1:0');
  });
});

describe('selectStreakReminderTimezones', () => {
  it('picks time zones at 19:00 local time on a weekday', () => {
    const at = new Date('2024-01-03T18:00:00Z');

    expect(selectStreakReminderTimezones(['Africa/Lagos', 'UTC', 'Not/AZone'], at)).toEqual(['Africa/Lagos']);
  });

  it('skips weekends', () => {
    const saturdayEvening = new Date('2024-01-06T18:00:00Z');

    expect(selectStreakReminderTimezones(['Africa/Lagos'], saturdayEvening)).toEqual([]);
  });
});

describe('processLearnerReminderScan', () => {
  it('sends each reminder once across reruns', async () => {
    listRegisteredLearnersStartingBetween.mockResolvedValue([registered('soon', 50, 'a'), registered('now', 2, 'b')]);
    listDueExerciseStudentsWithoutSubmission.mockResolvedValue([
      {
        exerciseId: 'ex-1',
        courseId: 'course-1',
        organizationId: 'org-1',
        dueBy: '2024-01-04 09:00:00',
        profileId: 'a'
      },
      {
        exerciseId: 'ex-1',
        courseId: 'course-1',
        organizationId: 'org-1',
        dueBy: '2024-01-04 09:00:00',
        profileId: 'c'
      }
    ]);

    const first = await processLearnerReminderScan(NOW);
    const second = await processLearnerReminderScan(NOW);

    expect(first).toEqual({ liveClass: 2, assignmentDue: 2, streakRisk: 0 });
    expect(second).toEqual({ liveClass: 0, assignmentDue: 0, streakRisk: 0 });
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assignment_due_soon',
        entityId: 'ex-1',
        dedupeKey: 'assignment_due_soon:ex-1:2024-01-04 09:00:00'
      })
    );
  });

  it('reminds a learner with a streak and no activity today, once per day', async () => {
    const evening = new Date('2024-01-03T18:00:00Z');
    listLearnerGoalTimezones.mockResolvedValue(['Africa/Lagos', 'UTC']);
    listLearnerGoalsInTimezones.mockResolvedValue([goal('active', 'Africa/Lagos'), goal('idle', 'Africa/Lagos')]);
    listLearnerActivity.mockResolvedValue([
      { profileId: 'profile-active', kind: 'lesson', at: '2024-01-02T10:00:00Z' },
      { profileId: 'profile-active', kind: 'lesson', at: '2024-01-03T10:00:00Z' },
      { profileId: 'profile-idle', kind: 'lesson', at: '2024-01-01T10:00:00Z' },
      { profileId: 'profile-idle', kind: 'exercise', at: '2024-01-02T10:00:00Z' }
    ]);

    const first = await processLearnerReminderScan(evening);
    const second = await processLearnerReminderScan(evening);

    expect(first.streakRisk).toBe(1);
    expect(second.streakRisk).toBe(0);
    expect(listLearnerGoalsInTimezones).toHaveBeenCalledWith(['Africa/Lagos']);
    expect(listLearnerActivity).toHaveBeenLastCalledWith(expect.objectContaining({ profileIds: ['profile-active'] }));
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'streak_at_risk',
        recipientProfileIds: ['profile-idle'],
        dedupeKey: 'streak_at_risk:idle:2024-01-03'
      })
    );
  });

  it('keeps going when one part fails', async () => {
    listRegisteredLearnersStartingBetween.mockRejectedValue(new Error('db down'));
    listDueExerciseStudentsWithoutSubmission.mockResolvedValue([
      {
        exerciseId: 'ex-1',
        courseId: 'course-1',
        organizationId: 'org-1',
        dueBy: '2024-01-04 09:00:00',
        profileId: 'a'
      }
    ]);

    await expect(processLearnerReminderScan(NOW)).resolves.toEqual({ liveClass: 0, assignmentDue: 1, streakRisk: 0 });
  });
});
