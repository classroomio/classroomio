import * as schema from '@db/schema';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TCohortGoal = typeof schema.cohortGoal.$inferSelect;
export type TNewCohortGoal = typeof schema.cohortGoal.$inferInsert;
export type TCohortGoalAssignment = typeof schema.cohortGoalAssignment.$inferSelect;
export type TNewCohortGoalAssignment = typeof schema.cohortGoalAssignment.$inferInsert;

// ─── Goal CRUD ───────────────────────────────────────────────────────────────

export async function createCohortGoal(data: TNewCohortGoal): Promise<TCohortGoal> {
  try {
    const [goal] = await db.insert(schema.cohortGoal).values(data).returning();
    if (!goal) throw new Error('Failed to create cohort goal');

    return goal;
  } catch (error) {
    console.error('createCohortGoal error:', error);
    throw new Error(`Failed to create cohort goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortGoalById(goalId: string): Promise<TCohortGoal | null> {
  try {
    const [goal] = await db.select().from(schema.cohortGoal).where(eq(schema.cohortGoal.id, goalId)).limit(1);

    return goal ?? null;
  } catch (error) {
    console.error('getCohortGoalById error:', error);
    throw new Error(
      `Failed to get cohort goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCohortGoals(
  cohortId: string,
  options: { includeArchived?: boolean } = {}
): Promise<TCohortGoal[]> {
  try {
    const conditions = [eq(schema.cohortGoal.cohortId, cohortId)];
    if (!options.includeArchived) {
      conditions.push(eq(schema.cohortGoal.status, 'active'));
    }

    return await db
      .select()
      .from(schema.cohortGoal)
      .where(and(...conditions))
      .orderBy(asc(schema.cohortGoal.createdAt));
  } catch (error) {
    console.error('getCohortGoals error:', error);
    throw new Error(`Failed to list cohort goals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortGoalsByOrg(
  organizationId: string
): Promise<Array<TCohortGoal & { cohortId: string; cohortName: string }>> {
  try {
    const result = await db
      .select({
        goal: schema.cohortGoal,
        cohortName: schema.cohort.name
      })
      .from(schema.cohortGoal)
      .innerJoin(schema.cohort, eq(schema.cohortGoal.cohortId, schema.cohort.id))
      .where(and(eq(schema.cohort.organizationId, organizationId), eq(schema.cohortGoal.status, 'active')));

    return result.map((row) => ({ ...row.goal, cohortName: row.cohortName }));
  } catch (error) {
    console.error('getCohortGoalsByOrg error:', error);
    throw new Error(`Failed to list goals for org: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Every active goal across every org. Used by the daily cron sweep. */
export async function listAllActiveCohortGoals(): Promise<TCohortGoal[]> {
  try {
    return await db.select().from(schema.cohortGoal).where(eq(schema.cohortGoal.status, 'active'));
  } catch (error) {
    console.error('listAllActiveCohortGoals error:', error);
    throw new Error(`Failed to list active goals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * For the reminder scan: every assignment whose `dueDate` is in the future and
 * whose status is not yet completed/waived. The caller decides the cadence
 * (compares daysUntilDue against goal.reminderDaysBefore).
 */
export async function listAssignmentsForReminderScan(): Promise<
  Array<{
    assignment: TCohortGoalAssignment;
    goal: TCohortGoal;
    profileId: string;
    email: string | null;
    cohortId: string;
    cohortName: string;
    organizationName: string;
    organizationSiteName: string | null;
    organizationCustomDomain: string | null;
    organizationIsCustomDomainVerified: boolean | null;
    organizationAvatarUrl: string | null;
    organizationTheme: string | null;
  }>
> {
  try {
    const result = await db
      .select({
        assignment: schema.cohortGoalAssignment,
        goal: schema.cohortGoal,
        profileId: schema.cohortMember.profileId,
        email: schema.cohortMember.email,
        cohortId: schema.cohort.id,
        cohortName: schema.cohort.name,
        organizationName: schema.organization.name,
        organizationSiteName: schema.organization.siteName,
        organizationCustomDomain: schema.organization.customDomain,
        organizationIsCustomDomainVerified: schema.organization.isCustomDomainVerified,
        organizationAvatarUrl: schema.organization.avatarUrl,
        organizationTheme: schema.organization.theme
      })
      .from(schema.cohortGoalAssignment)
      .innerJoin(schema.cohortMember, eq(schema.cohortGoalAssignment.cohortMemberId, schema.cohortMember.id))
      .innerJoin(schema.cohortGoal, eq(schema.cohortGoalAssignment.goalId, schema.cohortGoal.id))
      .innerJoin(schema.cohort, eq(schema.cohortGoal.cohortId, schema.cohort.id))
      .innerJoin(schema.organization, eq(schema.cohort.organizationId, schema.organization.id))
      .where(
        and(
          eq(schema.cohortGoal.status, 'active'),
          inArray(schema.cohortGoalAssignment.status, ['not_started', 'in_progress', 'at_risk', 'overdue'])
        )
      );

    return result
      .filter((row) => row.profileId != null)
      .map((row) => ({
        assignment: row.assignment,
        goal: row.goal,
        profileId: row.profileId!,
        email: row.email,
        cohortId: row.cohortId,
        cohortName: row.cohortName,
        organizationName: row.organizationName,
        organizationSiteName: row.organizationSiteName,
        organizationCustomDomain: row.organizationCustomDomain,
        organizationIsCustomDomainVerified: row.organizationIsCustomDomainVerified,
        organizationAvatarUrl: row.organizationAvatarUrl,
        organizationTheme: row.organizationTheme
      }));
  } catch (error) {
    console.error('listAssignmentsForReminderScan error:', error);
    throw new Error(
      `Failed to list assignments for reminder scan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCohortGoal(goalId: string, data: Partial<TNewCohortGoal>): Promise<TCohortGoal | null> {
  try {
    const [updated] = await db
      .update(schema.cohortGoal)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schema.cohortGoal.id, goalId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateCohortGoal error:', error);
    throw new Error(
      `Failed to update cohort goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortGoal(goalId: string): Promise<TCohortGoal | null> {
  try {
    const [deleted] = await db.delete(schema.cohortGoal).where(eq(schema.cohortGoal.id, goalId)).returning();

    return deleted ?? null;
  } catch (error) {
    console.error('deleteCohortGoal error:', error);
    throw new Error(
      `Failed to delete cohort goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Goal Assignments ────────────────────────────────────────────────────────

export async function upsertCohortGoalAssignments(rows: TNewCohortGoalAssignment[]): Promise<TCohortGoalAssignment[]> {
  if (rows.length === 0) return [];

  try {
    return await db
      .insert(schema.cohortGoalAssignment)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.cohortGoalAssignment.goalId, schema.cohortGoalAssignment.cohortMemberId],
        set: {
          dueDate: sql`excluded.due_date`,
          status: sql`excluded.status`,
          completedCount: sql`excluded.completed_count`,
          requiredCount: sql`excluded.required_count`,
          completedAt: sql`excluded.completed_at`,
          lastEvaluatedAt: sql`excluded.last_evaluated_at`,
          updatedAt: sql`now()`
        }
      })
      .returning();
  } catch (error) {
    console.error('upsertCohortGoalAssignments error:', error);
    throw new Error(`Failed to upsert goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCohortGoalAssignments(goalId: string): Promise<TCohortGoalAssignment[]> {
  try {
    return await db.select().from(schema.cohortGoalAssignment).where(eq(schema.cohortGoalAssignment.goalId, goalId));
  } catch (error) {
    console.error('getCohortGoalAssignments error:', error);
    throw new Error(`Failed to get goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssignmentsForCohortMembers(cohortMemberIds: string[]): Promise<TCohortGoalAssignment[]> {
  if (cohortMemberIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.cohortGoalAssignment)
      .where(inArray(schema.cohortGoalAssignment.cohortMemberId, cohortMemberIds));
  } catch (error) {
    console.error('getAssignmentsForCohortMembers error:', error);
    throw new Error(`Failed to get goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssignmentsForProfile(profileId: string): Promise<
  Array<
    TCohortGoalAssignment & {
      goal: TCohortGoal;
      cohortId: string;
      cohortName: string;
    }
  >
> {
  try {
    const result = await db
      .select({
        assignment: schema.cohortGoalAssignment,
        goal: schema.cohortGoal,
        cohortId: schema.cohort.id,
        cohortName: schema.cohort.name
      })
      .from(schema.cohortGoalAssignment)
      .innerJoin(schema.cohortMember, eq(schema.cohortGoalAssignment.cohortMemberId, schema.cohortMember.id))
      .innerJoin(schema.cohortGoal, eq(schema.cohortGoalAssignment.goalId, schema.cohortGoal.id))
      .innerJoin(schema.cohort, eq(schema.cohortGoal.cohortId, schema.cohort.id))
      .where(and(eq(schema.cohortMember.profileId, profileId), eq(schema.cohortGoal.status, 'active')));

    return result.map((row) => ({
      ...row.assignment,
      goal: row.goal,
      cohortId: row.cohortId,
      cohortName: row.cohortName
    }));
  } catch (error) {
    console.error('getAssignmentsForProfile error:', error);
    throw new Error(
      `Failed to get goal assignments for profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Per-goal status counts for a cohort (used by dashboard tiles).
 */
export async function countAssignmentsByStatus(goalIds: string[]): Promise<Map<string, Record<string, number>>> {
  if (goalIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({
        goalId: schema.cohortGoalAssignment.goalId,
        status: schema.cohortGoalAssignment.status,
        count: sql<number>`count(*)::int`.as('count')
      })
      .from(schema.cohortGoalAssignment)
      .where(inArray(schema.cohortGoalAssignment.goalId, goalIds))
      .groupBy(schema.cohortGoalAssignment.goalId, schema.cohortGoalAssignment.status);

    const map = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const bucket = map.get(row.goalId) ?? {};
      bucket[row.status] = Number(row.count) || 0;
      map.set(row.goalId, bucket);
    }

    return map;
  } catch (error) {
    console.error('countAssignmentsByStatus error:', error);
    throw new Error(`Failed to count goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ─── Evaluator Inputs ────────────────────────────────────────────────────────

/**
 * For each (profile, course) pair, return the most recent course_completion_record
 * (cycle-aware compliance status) plus optional score. Used by the goal evaluator.
 */
export async function getLatestCompletionRecordsForProfilesAndCourses(
  profileIds: string[],
  courseIds: string[]
): Promise<
  Array<{ profileId: string; courseId: string; status: string; score: number | null; completedAt: string | null }>
> {
  if (profileIds.length === 0 || courseIds.length === 0) return [];

  try {
    const rows = await db
      .select({
        profileId: schema.courseCompletionRecord.profileId,
        courseId: schema.courseCompletionRecord.courseId,
        status: schema.courseCompletionRecord.status,
        score: schema.courseCompletionRecord.score,
        completedAt: schema.courseCompletionRecord.completedAt,
        cycleNumber: schema.courseCompletionRecord.cycleNumber
      })
      .from(schema.courseCompletionRecord)
      .where(
        and(
          inArray(schema.courseCompletionRecord.profileId, profileIds),
          inArray(schema.courseCompletionRecord.courseId, courseIds)
        )
      );

    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = `${row.profileId}:${row.courseId}`;
      const prev = latest.get(key);
      if (!prev || (row.cycleNumber ?? 0) > (prev.cycleNumber ?? 0)) {
        latest.set(key, row);
      }
    }

    return [...latest.values()].map((row) => ({
      profileId: row.profileId,
      courseId: row.courseId,
      status: row.status,
      score: row.score ?? null,
      completedAt: row.completedAt ?? null
    }));
  } catch (error) {
    console.error('getLatestCompletionRecordsForProfilesAndCourses error:', error);
    throw new Error(`Failed to load completion records: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback completion source for non-compliance courses: a learner is considered
 * "done" with a course when every lesson in the course has a `lesson_completion`
 * row marked completed. Returns set of (profileId, courseId) keys that match.
 */
export async function getNonComplianceCourseCompletions(
  profileIds: string[],
  courseIds: string[]
): Promise<Set<string>> {
  if (profileIds.length === 0 || courseIds.length === 0) return new Set();

  try {
    const rows = await db
      .select({
        profileId: schema.lessonCompletion.profileId,
        courseId: schema.lesson.courseId,
        totalLessons: sql<number>`COUNT(DISTINCT ${schema.lesson.id})::int`.as('totalLessons'),
        completedLessons: sql<number>`
          COUNT(DISTINCT CASE
            WHEN ${schema.lessonCompletion.isComplete} = true THEN ${schema.lessonCompletion.lessonId}
            ELSE NULL
          END)::int
        `.as('completedLessons')
      })
      .from(schema.lesson)
      .leftJoin(
        schema.lessonCompletion,
        and(
          eq(schema.lessonCompletion.lessonId, schema.lesson.id),
          inArray(schema.lessonCompletion.profileId, profileIds)
        )
      )
      .where(inArray(schema.lesson.courseId, courseIds))
      .groupBy(schema.lessonCompletion.profileId, schema.lesson.courseId);

    const completed = new Set<string>();
    for (const row of rows) {
      if (!row.profileId || !row.courseId) continue;
      if (row.totalLessons > 0 && row.completedLessons >= row.totalLessons) {
        completed.add(`${row.profileId}:${row.courseId}`);
      }
    }

    return completed;
  } catch (error) {
    console.error('getNonComplianceCourseCompletions error:', error);
    throw new Error(`Failed to load lesson completions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * For score / pass_rate goals: pull the highest score per (profile, course)
 * across compliance records (which already store the assessment score).
 */
export async function getMaxScoresForProfilesAndCourses(
  profileIds: string[],
  courseIds: string[]
): Promise<Map<string, number>> {
  if (profileIds.length === 0 || courseIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({
        profileId: schema.courseCompletionRecord.profileId,
        courseId: schema.courseCompletionRecord.courseId,
        maxScore: sql<number | null>`MAX(${schema.courseCompletionRecord.score})`.as('maxScore')
      })
      .from(schema.courseCompletionRecord)
      .where(
        and(
          inArray(schema.courseCompletionRecord.profileId, profileIds),
          inArray(schema.courseCompletionRecord.courseId, courseIds)
        )
      )
      .groupBy(schema.courseCompletionRecord.profileId, schema.courseCompletionRecord.courseId);

    const map = new Map<string, number>();
    for (const row of rows) {
      if (row.maxScore == null) continue;
      map.set(`${row.profileId}:${row.courseId}`, Number(row.maxScore));
    }

    return map;
  } catch (error) {
    console.error('getMaxScoresForProfilesAndCourses error:', error);
    throw new Error(`Failed to load scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
