import {
  and,
  asc,
  course,
  db,
  eq,
  group,
  groupAttendance,
  groupmember,
  inArray,
  learnerGoal,
  lesson,
  lessonCompletion,
  submission
} from '@db/drizzle';
import { listLearnerActivity } from '@db/queries/learner/goals';
import {
  addDays,
  computeActivityStreak,
  isWeekendDay,
  localDayKey,
  startOfIsoWeek,
  type DayKey
} from '@cio/utils/functions/learner-streak';

import { daysFromNow } from './demoCatalogTypes';
import type { DemoAccounts } from './demoPeople';

const TIMEZONE = 'Africa/Lagos';
const CURRENT_STREAK_DAYS = 5;
const BEST_STREAK_DAYS = 10;
const WEEKLY_TARGET_HEADROOM = 3;
const MIN_WEEKLY_TARGET = 5;

function previousWeekday(day: DayKey): DayKey {
  let candidate = addDays(day, -1);
  while (isWeekendDay(candidate)) candidate = addDays(candidate, -1);

  return candidate;
}

function weekdaysBefore(day: DayKey, count: number): DayKey[] {
  const days: DayKey[] = [];
  let cursor = day;
  for (let index = 0; index < count; index++) {
    cursor = previousWeekday(cursor);
    days.push(cursor);
  }

  return days;
}

/**
 * Lays student@test.com's existing lesson completions on a five-day current streak and an earlier ten-day best streak,
 * with an empty weekday between them, and sets a weekly lesson goal they are partway through.
 */
export async function seedDemoGoals({
  accounts,
  selectedOrganizationId
}: {
  accounts: DemoAccounts;
  selectedOrganizationId?: string;
}) {
  if (selectedOrganizationId && selectedOrganizationId !== accounts.udemyOrgId) return;

  const now = new Date();
  const today = localDayKey(now, TIMEZONE);
  const currentDays = [today, ...weekdaysBefore(today, CURRENT_STREAK_DAYS - 1)];
  const gapDay = previousWeekday(currentDays[currentDays.length - 1]);
  const bestDays = weekdaysBefore(gapDay, BEST_STREAK_DAYS);
  const targetDays = [...currentDays, ...bestDays];
  const moveTo = currentDays[1] ?? today;

  const atDay = (day: DayKey) => {
    const noon = new Date(`${day}T12:00:00.000Z`);
    const latest = new Date(now.getTime() - 5 * 60 * 1000);

    return (noon > latest ? latest : noon).toISOString();
  };

  const completions = await db
    .select({ id: lessonCompletion.id, at: lessonCompletion.updatedAt })
    .from(lessonCompletion)
    .innerJoin(lesson, eq(lesson.id, lessonCompletion.lessonId))
    .innerJoin(course, eq(course.id, lesson.courseId))
    .innerJoin(group, eq(group.id, course.groupId))
    .where(
      and(
        eq(lessonCompletion.profileId, accounts.student),
        eq(lessonCompletion.isComplete, true),
        eq(group.organizationId, accounts.udemyOrgId)
      )
    )
    .orderBy(asc(lessonCompletion.lessonId));

  const placed = completions.slice(0, targetDays.length);
  for (const [index, row] of placed.entries()) {
    const at = atDay(targetDays[index]);
    await db.update(lessonCompletion).set({ createdAt: at, updatedAt: at }).where(eq(lessonCompletion.id, row.id));
  }

  const onGapDay = (at: string | null) => Boolean(at) && localDayKey(at!, TIMEZONE) === gapDay;
  for (const row of completions.slice(placed.length)) {
    if (!onGapDay(row.at)) continue;

    await db
      .update(lessonCompletion)
      .set({ createdAt: atDay(moveTo), updatedAt: atDay(moveTo) })
      .where(eq(lessonCompletion.id, row.id));
  }

  const memberRows = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .innerJoin(group, eq(group.id, groupmember.groupId))
    .where(and(eq(groupmember.profileId, accounts.student), eq(group.organizationId, accounts.udemyOrgId)));
  const memberIds = memberRows.map((row) => row.id);

  if (memberIds.length > 0) {
    const submissions = await db
      .select({ id: submission.id, at: submission.createdAt })
      .from(submission)
      .where(inArray(submission.submittedBy, memberIds));
    for (const row of submissions) {
      if (!onGapDay(row.at)) continue;

      await db
        .update(submission)
        .set({ createdAt: atDay(moveTo) })
        .where(eq(submission.id, row.id));
    }

    const attendance = await db
      .select({ id: groupAttendance.id, at: groupAttendance.checkedInAt })
      .from(groupAttendance)
      .where(inArray(groupAttendance.studentId, memberIds));
    for (const row of attendance) {
      if (!onGapDay(row.at)) continue;

      await db
        .update(groupAttendance)
        .set({ checkedInAt: atDay(moveTo) })
        .where(eq(groupAttendance.id, row.id));
    }
  }

  const weekStart = startOfIsoWeek(today);
  const thisWeek = completions.filter((row, index) => {
    const at = index < placed.length ? atDay(targetDays[index]) : row.at;

    return at ? localDayKey(at, TIMEZONE) >= weekStart : false;
  }).length;
  const weeklyLessonTarget = Math.max(MIN_WEEKLY_TARGET, thisWeek + WEEKLY_TARGET_HEADROOM);

  await db
    .insert(learnerGoal)
    .values({
      profileId: accounts.student,
      organizationId: accounts.udemyOrgId,
      weeklyLessonTarget,
      timezone: TIMEZONE,
      createdAt: daysFromNow(now, -30)
    })
    .onConflictDoUpdate({
      target: [learnerGoal.profileId, learnerGoal.organizationId],
      set: { weeklyLessonTarget, timezone: TIMEZONE }
    });

  const activity = await listLearnerActivity({
    organizationId: accounts.udemyOrgId,
    profileIds: [accounts.student],
    since: daysFromNow(now, -400)
  });
  const streak = computeActivityStreak(
    activity.map((row) => localDayKey(row.at, TIMEZONE)),
    today
  );

  console.log(
    `   ✓ Demo goals: student@test.com streak ${streak.current} (best ${streak.best}), ${thisWeek} of ${weeklyLessonTarget} lessons this week`
  );
}
