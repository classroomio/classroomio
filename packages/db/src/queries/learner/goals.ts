import * as schema from '@db/schema';
import type { TLearnerGoal } from '@db/types';

import { and, eq, gte, inArray, isNotNull, ne } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type LearnerActivityKind = 'lesson' | 'exercise' | 'attendance';

export type LearnerActivityRow = { profileId: string; kind: LearnerActivityKind; at: string };

export async function getLearnerGoal(profileId: string, organizationId: string): Promise<TLearnerGoal | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.learnerGoal)
      .where(and(eq(schema.learnerGoal.profileId, profileId), eq(schema.learnerGoal.organizationId, organizationId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLearnerGoal error:', error);
    throw new Error('Failed to load learner goal');
  }
}

/** Creates the learner's goal row or updates the given fields; omitted fields keep their stored values. */
export async function upsertLearnerGoal(params: {
  profileId: string;
  organizationId: string;
  weeklyLessonTarget?: number;
  timezone?: string;
}): Promise<TLearnerGoal> {
  try {
    const now = new Date().toISOString();
    const changes = {
      ...(params.weeklyLessonTarget !== undefined ? { weeklyLessonTarget: params.weeklyLessonTarget } : {}),
      ...(params.timezone !== undefined ? { timezone: params.timezone } : {}),
      updatedAt: now
    };

    const [row] = await db
      .insert(schema.learnerGoal)
      .values({ profileId: params.profileId, organizationId: params.organizationId, ...changes })
      .onConflictDoUpdate({
        target: [schema.learnerGoal.profileId, schema.learnerGoal.organizationId],
        set: changes
      })
      .returning();

    if (!row) throw new Error('No learner goal row returned');

    return row;
  } catch (error) {
    console.error('upsertLearnerGoal error:', error);
    throw new Error('Failed to save learner goal');
  }
}

/** The distinct time zones learners have set, for the streak reminder scan. */
export async function listLearnerGoalTimezones(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ timezone: schema.learnerGoal.timezone })
      .from(schema.learnerGoal)
      .where(isNotNull(schema.learnerGoal.timezone));

    return rows.flatMap((row) => (row.timezone ? [row.timezone] : []));
  } catch (error) {
    console.error('listLearnerGoalTimezones error:', error);
    throw new Error('Failed to list learner goal time zones');
  }
}

/** Goal rows in the given time zones. */
export async function listLearnerGoalsInTimezones(timezones: string[]): Promise<TLearnerGoal[]> {
  if (timezones.length === 0) return [];

  try {
    return await db.select().from(schema.learnerGoal).where(inArray(schema.learnerGoal.timezone, timezones));
  } catch (error) {
    console.error('listLearnerGoalsInTimezones error:', error);
    throw new Error('Failed to list learner goals');
  }
}

/**
 * Learning activity that counts toward a streak in one organization since `since`: lesson completions, exercise
 * submissions and live session attendance (present or late).
 */
export async function listLearnerActivity(params: {
  organizationId: string;
  profileIds: string[];
  since: string;
}): Promise<LearnerActivityRow[]> {
  if (params.profileIds.length === 0) return [];

  try {
    const { organizationId, profileIds, since } = params;

    const [lessons, exercises, attendance] = await Promise.all([
      db
        .select({
          profileId: schema.lessonCompletion.profileId,
          at: schema.lessonCompletion.updatedAt,
          createdAt: schema.lessonCompletion.createdAt
        })
        .from(schema.lessonCompletion)
        .innerJoin(schema.lesson, eq(schema.lesson.id, schema.lessonCompletion.lessonId))
        .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
        .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
        .where(
          and(
            eq(schema.group.organizationId, organizationId),
            inArray(schema.lessonCompletion.profileId, profileIds),
            eq(schema.lessonCompletion.isComplete, true),
            gte(schema.lessonCompletion.updatedAt, since)
          )
        ),
      db
        .select({ profileId: schema.groupmember.profileId, at: schema.submission.createdAt })
        .from(schema.submission)
        .innerJoin(schema.groupmember, eq(schema.groupmember.id, schema.submission.submittedBy))
        .innerJoin(schema.group, eq(schema.group.id, schema.groupmember.groupId))
        .where(
          and(
            eq(schema.group.organizationId, organizationId),
            inArray(schema.groupmember.profileId, profileIds),
            gte(schema.submission.createdAt, since)
          )
        ),
      db
        .select({
          profileId: schema.groupmember.profileId,
          checkedInAt: schema.groupAttendance.checkedInAt,
          lessonAt: schema.lesson.lessonAt,
          createdAt: schema.groupAttendance.createdAt
        })
        .from(schema.groupAttendance)
        .innerJoin(schema.groupmember, eq(schema.groupmember.id, schema.groupAttendance.studentId))
        .innerJoin(schema.group, eq(schema.group.id, schema.groupmember.groupId))
        .innerJoin(schema.lesson, eq(schema.lesson.id, schema.groupAttendance.lessonId))
        .where(
          and(
            eq(schema.group.organizationId, organizationId),
            inArray(schema.groupmember.profileId, profileIds),
            ne(schema.groupAttendance.status, 'absent'),
            gte(schema.groupAttendance.createdAt, since)
          )
        )
    ]);

    const rows: LearnerActivityRow[] = [];
    for (const row of lessons) {
      const at = row.at ?? row.createdAt;
      if (row.profileId && at) rows.push({ profileId: row.profileId, kind: 'lesson', at });
    }
    for (const row of exercises) {
      if (row.profileId && row.at) rows.push({ profileId: row.profileId, kind: 'exercise', at: row.at });
    }
    for (const row of attendance) {
      const at = row.checkedInAt ?? row.lessonAt ?? row.createdAt;
      if (row.profileId && at) rows.push({ profileId: row.profileId, kind: 'attendance', at });
    }

    return rows;
  } catch (error) {
    console.error('listLearnerActivity error:', error);
    throw new Error('Failed to list learner activity');
  }
}
