import * as schema from '@db/schema';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TProgramGoal = typeof schema.programGoal.$inferSelect;
export type TNewProgramGoal = typeof schema.programGoal.$inferInsert;
export type TProgramGoalAssignment = typeof schema.programGoalAssignment.$inferSelect;
export type TNewProgramGoalAssignment = typeof schema.programGoalAssignment.$inferInsert;

// ─── Goal CRUD ───────────────────────────────────────────────────────────────

export async function createProgramGoal(data: TNewProgramGoal): Promise<TProgramGoal> {
  try {
    const [goal] = await db.insert(schema.programGoal).values(data).returning();
    if (!goal) throw new Error('Failed to create program goal');

    return goal;
  } catch (error) {
    console.error('createProgramGoal error:', error);
    throw new Error(`Failed to create program goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProgramGoalById(goalId: string): Promise<TProgramGoal | null> {
  try {
    const [goal] = await db.select().from(schema.programGoal).where(eq(schema.programGoal.id, goalId)).limit(1);

    return goal ?? null;
  } catch (error) {
    console.error('getProgramGoalById error:', error);
    throw new Error(
      `Failed to get program goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getProgramGoals(
  programId: string,
  options: { includeArchived?: boolean } = {}
): Promise<TProgramGoal[]> {
  try {
    const conditions = [eq(schema.programGoal.programId, programId)];
    if (!options.includeArchived) {
      conditions.push(eq(schema.programGoal.status, 'active'));
    }

    return await db
      .select()
      .from(schema.programGoal)
      .where(and(...conditions))
      .orderBy(asc(schema.programGoal.createdAt));
  } catch (error) {
    console.error('getProgramGoals error:', error);
    throw new Error(`Failed to list program goals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProgramGoalsByOrg(
  organizationId: string
): Promise<Array<TProgramGoal & { programId: string; programName: string }>> {
  try {
    const result = await db
      .select({
        goal: schema.programGoal,
        programName: schema.program.name
      })
      .from(schema.programGoal)
      .innerJoin(schema.program, eq(schema.programGoal.programId, schema.program.id))
      .where(and(eq(schema.program.organizationId, organizationId), eq(schema.programGoal.status, 'active')));

    return result.map((row) => ({ ...row.goal, programName: row.programName }));
  } catch (error) {
    console.error('getProgramGoalsByOrg error:', error);
    throw new Error(`Failed to list goals for org: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Every active goal across every org. Used by the daily cron sweep. */
export async function listAllActiveProgramGoals(): Promise<TProgramGoal[]> {
  try {
    return await db.select().from(schema.programGoal).where(eq(schema.programGoal.status, 'active'));
  } catch (error) {
    console.error('listAllActiveProgramGoals error:', error);
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
    assignment: TProgramGoalAssignment;
    goal: TProgramGoal;
    profileId: string;
    email: string | null;
    programId: string;
    programName: string;
    organizationName: string;
    organizationSiteName: string | null;
  }>
> {
  try {
    const result = await db
      .select({
        assignment: schema.programGoalAssignment,
        goal: schema.programGoal,
        profileId: schema.programMember.profileId,
        email: schema.programMember.email,
        programId: schema.program.id,
        programName: schema.program.name,
        organizationName: schema.organization.name,
        organizationSiteName: schema.organization.siteName
      })
      .from(schema.programGoalAssignment)
      .innerJoin(schema.programMember, eq(schema.programGoalAssignment.programMemberId, schema.programMember.id))
      .innerJoin(schema.programGoal, eq(schema.programGoalAssignment.goalId, schema.programGoal.id))
      .innerJoin(schema.program, eq(schema.programGoal.programId, schema.program.id))
      .innerJoin(schema.organization, eq(schema.program.organizationId, schema.organization.id))
      .where(
        and(
          eq(schema.programGoal.status, 'active'),
          inArray(schema.programGoalAssignment.status, ['not_started', 'in_progress', 'at_risk', 'overdue'])
        )
      );

    return result
      .filter((row) => row.profileId != null)
      .map((row) => ({
        assignment: row.assignment,
        goal: row.goal,
        profileId: row.profileId!,
        email: row.email,
        programId: row.programId,
        programName: row.programName,
        organizationName: row.organizationName,
        organizationSiteName: row.organizationSiteName
      }));
  } catch (error) {
    console.error('listAssignmentsForReminderScan error:', error);
    throw new Error(
      `Failed to list assignments for reminder scan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateProgramGoal(goalId: string, data: Partial<TNewProgramGoal>): Promise<TProgramGoal | null> {
  try {
    const [updated] = await db
      .update(schema.programGoal)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(schema.programGoal.id, goalId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateProgramGoal error:', error);
    throw new Error(
      `Failed to update program goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteProgramGoal(goalId: string): Promise<TProgramGoal | null> {
  try {
    const [deleted] = await db.delete(schema.programGoal).where(eq(schema.programGoal.id, goalId)).returning();

    return deleted ?? null;
  } catch (error) {
    console.error('deleteProgramGoal error:', error);
    throw new Error(
      `Failed to delete program goal "${goalId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Goal Assignments ────────────────────────────────────────────────────────

export async function upsertProgramGoalAssignments(
  rows: TNewProgramGoalAssignment[]
): Promise<TProgramGoalAssignment[]> {
  if (rows.length === 0) return [];

  try {
    return await db
      .insert(schema.programGoalAssignment)
      .values(rows)
      .onConflictDoUpdate({
        target: [schema.programGoalAssignment.goalId, schema.programGoalAssignment.programMemberId],
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
    console.error('upsertProgramGoalAssignments error:', error);
    throw new Error(`Failed to upsert goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProgramGoalAssignments(goalId: string): Promise<TProgramGoalAssignment[]> {
  try {
    return await db.select().from(schema.programGoalAssignment).where(eq(schema.programGoalAssignment.goalId, goalId));
  } catch (error) {
    console.error('getProgramGoalAssignments error:', error);
    throw new Error(`Failed to get goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssignmentsForProgramMembers(programMemberIds: string[]): Promise<TProgramGoalAssignment[]> {
  if (programMemberIds.length === 0) return [];

  try {
    return await db
      .select()
      .from(schema.programGoalAssignment)
      .where(inArray(schema.programGoalAssignment.programMemberId, programMemberIds));
  } catch (error) {
    console.error('getAssignmentsForProgramMembers error:', error);
    throw new Error(`Failed to get goal assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssignmentsForProfile(profileId: string): Promise<
  Array<
    TProgramGoalAssignment & {
      goal: TProgramGoal;
      programId: string;
      programName: string;
    }
  >
> {
  try {
    const result = await db
      .select({
        assignment: schema.programGoalAssignment,
        goal: schema.programGoal,
        programId: schema.program.id,
        programName: schema.program.name
      })
      .from(schema.programGoalAssignment)
      .innerJoin(schema.programMember, eq(schema.programGoalAssignment.programMemberId, schema.programMember.id))
      .innerJoin(schema.programGoal, eq(schema.programGoalAssignment.goalId, schema.programGoal.id))
      .innerJoin(schema.program, eq(schema.programGoal.programId, schema.program.id))
      .where(and(eq(schema.programMember.profileId, profileId), eq(schema.programGoal.status, 'active')));

    return result.map((row) => ({
      ...row.assignment,
      goal: row.goal,
      programId: row.programId,
      programName: row.programName
    }));
  } catch (error) {
    console.error('getAssignmentsForProfile error:', error);
    throw new Error(
      `Failed to get goal assignments for profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Per-goal status counts for a program (used by dashboard tiles).
 */
export async function countAssignmentsByStatus(goalIds: string[]): Promise<Map<string, Record<string, number>>> {
  if (goalIds.length === 0) return new Map();

  try {
    const rows = await db
      .select({
        goalId: schema.programGoalAssignment.goalId,
        status: schema.programGoalAssignment.status,
        count: sql<number>`count(*)::int`.as('count')
      })
      .from(schema.programGoalAssignment)
      .where(inArray(schema.programGoalAssignment.goalId, goalIds))
      .groupBy(schema.programGoalAssignment.goalId, schema.programGoalAssignment.status);

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
