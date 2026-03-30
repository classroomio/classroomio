import * as schema from '@db/schema';

import { and, asc, eq, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Whether an exercise is part of a course (direct course_id or via lesson).
 */
export async function exerciseBelongsToCourse(exerciseId: string, courseId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.exercise.id, exerciseId),
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId))
        )
      )
      .limit(1);

    return !!row;
  } catch (error) {
    console.error('exerciseBelongsToCourse error:', error);
    throw new Error(
      `Failed to check exercise belongs to course: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExerciseTitleAndMaxPoints(exerciseId: string): Promise<{ title: string; maxPoints: number }> {
  try {
    const [ex] = await db
      .select({ title: schema.exercise.title })
      .from(schema.exercise)
      .where(eq(schema.exercise.id, exerciseId))
      .limit(1);

    if (!ex) {
      return { title: '', maxPoints: 0 };
    }

    const [sumRow] = await db
      .select({
        maxPoints: sql<number>`coalesce(sum(${schema.question.points}), 0)::float`
      })
      .from(schema.question)
      .where(eq(schema.question.exerciseId, exerciseId));

    return { title: ex.title ?? '', maxPoints: Number(sumRow?.maxPoints ?? 0) };
  } catch (error) {
    console.error('getExerciseTitleAndMaxPoints error:', error);
    throw new Error(
      `Failed to get exercise title and max points: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getStudentSubmissionsForExercise(
  groupMemberId: string,
  exerciseId: string
): Promise<Array<{ total: number | null; gradingState: string | null }>> {
  try {
    return db
      .select({
        total: schema.submission.total,
        gradingState: schema.submission.gradingState
      })
      .from(schema.submission)
      .where(and(eq(schema.submission.exerciseId, exerciseId), eq(schema.submission.submittedBy, groupMemberId)))
      .orderBy(asc(schema.submission.createdAt));
  } catch (error) {
    console.error('getStudentSubmissionsForExercise error:', error);
    throw new Error(
      `Failed to list submissions for exercise: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
