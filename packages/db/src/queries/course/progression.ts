import * as schema from '@db/schema';

import { and, eq, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type ExerciseCompletionMember = { profileId: string } | { groupMemberId: string };

/** Allowed aliases for the exercise table in queries embedding the completion predicate. */
export type ExerciseAlias = 'exercise' | 'ex';

/**
 * Single source of truth for whether an exercise counts as completed for a student.
 *
 * Honors the exercise's completion policy:
 *  - 'submitted' (default): any submission counts
 *  - 'passed': a graded submission must score >= pass_threshold (default 100)
 *
 * Returns a boolean SQL predicate to embed in a query where the exercise table
 * is in scope under `exerciseAlias`. Every progress/completion computation
 * (course progress, enrolled courses, content items, progression locks) must
 * go through this predicate so completion reads the same everywhere.
 */
export function isExerciseCompletedSql(exerciseAlias: ExerciseAlias, member: ExerciseCompletionMember): SQL<boolean> {
  const exercise = sql.raw(exerciseAlias);
  const memberFilter =
    'groupMemberId' in member
      ? sql`cs.submitted_by = ${member.groupMemberId}`
      : sql`EXISTS (
          SELECT 1
          FROM ${schema.groupmember} AS cgm
          WHERE cgm.id = cs.submitted_by AND cgm.profile_id = ${member.profileId}
        )`;

  return sql<boolean>`EXISTS (
    SELECT 1
    FROM ${schema.submission} AS cs
    WHERE cs.exercise_id = ${exercise}.id
      AND ${memberFilter}
      AND (
        ${exercise}.completion_policy != 'passed'
        OR (
          cs.grading_state = 'completed'
          AND (
            SELECT CASE
              WHEN COALESCE(SUM(question.points), 0) <= 0 THEN false
              ELSE ROUND((cs.total::numeric / SUM(question.points)::numeric) * 100)
                >= COALESCE(${exercise}.pass_threshold, 100)
            END
            FROM ${schema.question}
            WHERE question.exercise_id = ${exercise}.id
          )
        )
      )
  )`;
}

export type LessonProgressionPolicy = {
  id: string;
  completionPolicy: string;
  videoWatchThreshold: number | null;
  isUnlocked: boolean | null;
};

export type ExerciseProgressionPolicy = {
  id: string;
  completionPolicy: string;
  passThreshold: number | null;
  isUnlocked: boolean | null;
};

export async function getLessonProgressionPolicies(courseId: string): Promise<LessonProgressionPolicy[]> {
  try {
    return db
      .select({
        id: schema.lesson.id,
        completionPolicy: schema.lesson.completionPolicy,
        videoWatchThreshold: schema.lesson.videoWatchThreshold,
        isUnlocked: schema.lesson.isUnlocked
      })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));
  } catch (error) {
    console.error('getLessonProgressionPolicies error:', error);
    throw new Error(
      `Failed to get lesson progression policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExerciseProgressionPolicies(courseId: string): Promise<ExerciseProgressionPolicy[]> {
  try {
    return db
      .select({
        id: schema.exercise.id,
        completionPolicy: schema.exercise.completionPolicy,
        passThreshold: schema.exercise.passThreshold,
        isUnlocked: schema.exercise.isUnlocked
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));
  } catch (error) {
    console.error('getExerciseProgressionPolicies error:', error);
    throw new Error(
      `Failed to get exercise progression policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function isExerciseCompletedForMember(exerciseId: string, groupMemberId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .where(and(eq(schema.exercise.id, exerciseId), isExerciseCompletedSql('exercise', { groupMemberId })))
      .limit(1);

    return !!row;
  } catch (error) {
    console.error('isExerciseCompletedForMember error:', error);
    throw new Error(
      `Failed to check exercise completion status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCompletedExerciseIdsForMember(courseId: string, groupMemberId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
          isExerciseCompletedSql('exercise', { groupMemberId })
        )
      );

    return new Set(rows.map((row) => row.id));
  } catch (error) {
    console.error('getCompletedExerciseIdsForMember error:', error);
    throw new Error(`Failed to get completed exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCompletedLessonIdsForProfile(courseId: string, profileId: string): Promise<Set<string>> {
  try {
    const rows = await db
      .select({ lessonId: schema.lessonCompletion.lessonId })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    return new Set(rows.map((row) => row.lessonId).filter((id): id is string => !!id));
  } catch (error) {
    console.error('getCompletedLessonIdsForProfile error:', error);
    throw new Error(`Failed to get completed lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
