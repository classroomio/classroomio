import {
  listLearnerActivity,
  listLearnerGoalsInTimezones,
  listLearnerGoalTimezones,
  type LearnerActivityRow
} from '@cio/db/queries/learner/goals';
import { listRegisteredLearnersStartingBetween, type RegisteredLearnerRow } from '@cio/db/queries/learner/live-classes';
import {
  listDueExerciseStudentsWithoutSubmission,
  type DueExerciseStudentRow
} from '@cio/db/queries/learner/recipients';
import { listExistingDedupeKeys } from '@cio/db/queries/notifications/notification';
import type { TLearnerGoal } from '@cio/db/types';
import { streakActivitySince, summarizeLearnerActivity } from '@cio/core/services/learner/goals';
import { notify } from '@cio/core/services/notification/notify';
import { STREAK_RISK_LOCAL_HOUR } from '@cio/utils/constants/learner-goals';
import { isValidTimeZone, isWeekendDay, localDayKey, localHour } from '@cio/utils/functions/learner-streak';

import { log } from '../../utils/logger';

const MINUTE_MS = 60_000;

export const LIVE_CLASS_REMINDER_LEAD_MINUTES = 60;

/** A class starting this soon gets only the "starting now" reminder, not both back to back. */
export const LIVE_CLASS_START_GRACE_MINUTES = 5;

/** How long after the start a missed "starting now" reminder is still worth sending. */
export const LIVE_CLASS_LATE_MINUTES = 10;

export const ASSIGNMENT_DUE_SOON_HOURS = 24;

export type LiveClassReminder = {
  lessonId: string;
  courseId: string;
  organizationId: string;
  offsetMinutes: 0 | typeof LIVE_CLASS_REMINDER_LEAD_MINUTES;
  profileIds: string[];
};

/**
 * Groups registered learners into the reminder each class is due for now: one hour before (sent once the class is
 * within the hour) and at the start. The offset is part of the dedupe key, so a rerun of the scan sends nothing new.
 */
export function planLiveClassReminders(rows: RegisteredLearnerRow[], now: Date): LiveClassReminder[] {
  const byKey = new Map<string, LiveClassReminder>();

  for (const row of rows) {
    const minutesUntil = (new Date(row.lessonAt).getTime() - now.getTime()) / MINUTE_MS;
    if (minutesUntil > LIVE_CLASS_REMINDER_LEAD_MINUTES || minutesUntil <= -LIVE_CLASS_LATE_MINUTES) continue;

    const offsetMinutes = minutesUntil > LIVE_CLASS_START_GRACE_MINUTES ? LIVE_CLASS_REMINDER_LEAD_MINUTES : 0;
    const key = `${row.lessonId}:${offsetMinutes}`;
    const reminder = byKey.get(key) ?? {
      lessonId: row.lessonId,
      courseId: row.courseId,
      organizationId: row.organizationId,
      offsetMinutes,
      profileIds: []
    };

    if (!reminder.profileIds.includes(row.profileId)) reminder.profileIds.push(row.profileId);
    byKey.set(key, reminder);
  }

  return [...byKey.values()];
}

/**
 * The hour-before reminder shares its key with the course's own one-hour session reminder, so a registered learner
 * gets one notification for it, whichever scan runs first.
 */
export function liveClassReminderDedupeKey(reminder: Pick<LiveClassReminder, 'lessonId' | 'offsetMinutes'>): string {
  if (reminder.offsetMinutes === LIVE_CLASS_REMINDER_LEAD_MINUTES) {
    return `live_session_reminder:${reminder.lessonId}:${LIVE_CLASS_REMINDER_LEAD_MINUTES}`;
  }

  return `live_class_starting:${reminder.lessonId}:0`;
}

/** The time zones where it is now the reminder hour on a weekday. */
export function selectStreakReminderTimezones(timezones: string[], now: Date): string[] {
  return timezones.filter((timeZone) => {
    if (!isValidTimeZone(timeZone)) return false;

    return localHour(now, timeZone) === STREAK_RISK_LOCAL_HOUR && !isWeekendDay(localDayKey(now, timeZone));
  });
}

function streakReminderDedupeKey(goal: TLearnerGoal, now: Date): string {
  return `streak_at_risk:${goal.id}:${localDayKey(now, goal.timezone ?? 'UTC')}`;
}

function groupBy<T>(rows: T[], keyOf: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return groups;
}

async function sendLiveClassReminders(now: Date): Promise<number> {
  const rows = await listRegisteredLearnersStartingBetween(
    new Date(now.getTime() - LIVE_CLASS_LATE_MINUTES * MINUTE_MS),
    new Date(now.getTime() + LIVE_CLASS_REMINDER_LEAD_MINUTES * MINUTE_MS)
  );

  let sent = 0;
  for (const reminder of planLiveClassReminders(rows, now)) {
    const result = await notify({
      organizationId: reminder.organizationId,
      recipientProfileIds: reminder.profileIds,
      type: 'live_class_starting',
      entityId: reminder.lessonId,
      courseId: reminder.courseId,
      dedupeKey: liveClassReminderDedupeKey(reminder)
    });
    sent += result.notificationIds.length;
  }

  return sent;
}

async function sendAssignmentDueReminders(now: Date): Promise<number> {
  const rows = await listDueExerciseStudentsWithoutSubmission(
    now,
    new Date(now.getTime() + ASSIGNMENT_DUE_SOON_HOURS * 60 * MINUTE_MS)
  );

  let sent = 0;
  for (const exerciseRows of groupBy(rows, (row: DueExerciseStudentRow) => row.exerciseId).values()) {
    const [exercise] = exerciseRows;
    const result = await notify({
      organizationId: exercise.organizationId,
      recipientProfileIds: exerciseRows.map((row) => row.profileId),
      type: 'assignment_due_soon',
      entityId: exercise.exerciseId,
      courseId: exercise.courseId,
      dedupeKey: `assignment_due_soon:${exercise.exerciseId}:${exercise.dueBy}`
    });
    sent += result.notificationIds.length;
  }

  return sent;
}

/**
 * Evening reminders for learners whose streak would break today. Only learners at the reminder hour are loaded,
 * and those already reminded today are skipped before their activity is read.
 */
async function sendStreakRiskReminders(now: Date): Promise<number> {
  const timezones = selectStreakReminderTimezones(await listLearnerGoalTimezones(), now);
  const goals = await listLearnerGoalsInTimezones(timezones);
  if (goals.length === 0) return 0;

  const reminded = await listExistingDedupeKeys(
    goals.map((goal) => goal.profileId),
    goals.map((goal) => streakReminderDedupeKey(goal, now))
  );
  const pending = goals.filter((goal) => !reminded.has(streakReminderDedupeKey(goal, now)));

  let sent = 0;
  for (const [organizationId, orgGoals] of groupBy(pending, (goal) => goal.organizationId)) {
    const activity = await listLearnerActivity({
      organizationId,
      profileIds: orgGoals.map((goal) => goal.profileId),
      since: streakActivitySince(now)
    });
    const activityByProfile = groupBy(activity, (row: LearnerActivityRow) => row.profileId);

    for (const goal of orgGoals) {
      const summary = summarizeLearnerActivity({
        activity: activityByProfile.get(goal.profileId) ?? [],
        weeklyLessonTarget: goal.weeklyLessonTarget,
        timeZone: goal.timezone ?? 'UTC',
        now
      });
      if (summary.streak.current === 0 || summary.streak.activeToday) continue;

      const result = await notify({
        organizationId,
        recipientProfileIds: [goal.profileId],
        type: 'streak_at_risk',
        entityId: goal.id,
        dedupeKey: streakReminderDedupeKey(goal, now)
      });
      sent += result.notificationIds.length;
    }
  }

  return sent;
}

type ScanResult = { liveClass: number; assignmentDue: number; streakRisk: number };

/**
 * Learner reminders that depend on the clock: live classes starting soon, assignments due within a day, and
 * evening streak reminders. Each part runs on its own so one failure does not stop the others.
 */
export async function processLearnerReminderScan(now: Date = new Date()): Promise<ScanResult> {
  const run = async (name: string, send: (at: Date) => Promise<number>) => {
    try {
      return await send(now);
    } catch (error) {
      log.error('learner-reminder-scan-part-failed', {
        part: name,
        error: error instanceof Error ? error.message : String(error)
      });

      return 0;
    }
  };

  const result = {
    liveClass: await run('live-class', sendLiveClassReminders),
    assignmentDue: await run('assignment-due', sendAssignmentDueReminders),
    streakRisk: await run('streak-risk', sendStreakRiskReminders)
  };

  log.info('learner-reminder-scan-complete', result);

  return result;
}
