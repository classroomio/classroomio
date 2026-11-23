import {
  getLearnerGoal,
  listLearnerActivity,
  upsertLearnerGoal,
  type LearnerActivityRow
} from '@cio/db/queries/learner/goals';
import { DEFAULT_WEEKLY_LESSON_TARGET, STREAK_LOOKBACK_DAYS } from '@cio/utils/constants/learner-goals';
import {
  computeActivityStreak,
  localDayKey,
  recentStreakDays,
  resolveTimeZone,
  startOfIsoWeek,
  streakMilestones,
  type DayKey
} from '@cio/utils/functions/learner-streak';

const DAY_MS = 24 * 60 * 60 * 1000;

export function streakActivitySince(now: Date): string {
  return new Date(now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS).toISOString();
}

/** Streak, weekly lesson goal and milestones from a learner's activity, counted in `timeZone`. */
export function summarizeLearnerActivity(params: {
  activity: Pick<LearnerActivityRow, 'kind' | 'at'>[];
  weeklyLessonTarget: number;
  timeZone: string;
  now: Date;
}) {
  const timeZone = resolveTimeZone(params.timeZone);
  const today = localDayKey(params.now, timeZone);
  const weekStart = startOfIsoWeek(today);
  const activeDays = new Set<DayKey>();
  let lessonsThisWeek = 0;

  for (const row of params.activity) {
    const day = localDayKey(row.at, timeZone);
    if (day > today) continue;

    activeDays.add(day);
    if (row.kind === 'lesson' && day >= weekStart) lessonsThisWeek += 1;
  }

  const streak = computeActivityStreak(activeDays, today);

  return {
    timezone: timeZone,
    today,
    streak: {
      ...streak,
      days: recentStreakDays(activeDays, today)
    },
    weeklyGoal: {
      target: params.weeklyLessonTarget,
      completed: lessonsThisWeek,
      weekStart,
      isReached: lessonsThisWeek >= params.weeklyLessonTarget
    },
    milestones: streakMilestones(streak)
  };
}

export type LearnerGoalSummary = ReturnType<typeof summarizeLearnerActivity> & { goalId: string | null };

/**
 * The learner's streak, weekly lesson goal and milestones in one organization. A valid `timezone` is saved on the
 * goal row so reminders follow the learner's local day; without one the stored zone, then UTC, is used.
 */
export async function getLearnerGoalSummary(params: {
  organizationId: string;
  profileId: string;
  timezone?: string;
  now?: Date;
}): Promise<LearnerGoalSummary> {
  const now = params.now ?? new Date();
  const stored = await getLearnerGoal(params.profileId, params.organizationId);
  const goal =
    params.timezone && params.timezone !== stored?.timezone
      ? await upsertLearnerGoal({
          profileId: params.profileId,
          organizationId: params.organizationId,
          timezone: params.timezone
        })
      : stored;

  const activity = await listLearnerActivity({
    organizationId: params.organizationId,
    profileIds: [params.profileId],
    since: streakActivitySince(now)
  });

  return {
    goalId: goal?.id ?? null,
    ...summarizeLearnerActivity({
      activity,
      weeklyLessonTarget: goal?.weeklyLessonTarget ?? DEFAULT_WEEKLY_LESSON_TARGET,
      timeZone: goal?.timezone ?? 'UTC',
      now
    })
  };
}
