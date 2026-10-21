import * as schema from '@db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export async function getExerciseMaxPoints(exerciseId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({
        maxPoints: sql<number>`coalesce(sum(${schema.question.points}), 0)::float`
      })
      .from(schema.question)
      .where(eq(schema.question.exerciseId, exerciseId));

    return Number(row?.maxPoints ?? 0);
  } catch (error) {
    console.error('getExerciseMaxPoints error:', error);
    throw new Error(`Failed to get exercise max points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getStudentExerciseSubmissions(
  groupMemberId: string,
  exerciseId: string,
  dbClient: DbOrTxClient = db
): Promise<Array<{ total: number | null; gradingState: string | null }>> {
  try {
    return dbClient
      .select({
        total: schema.submission.total,
        gradingState: schema.submission.gradingState
      })
      .from(schema.submission)
      .where(and(eq(schema.submission.exerciseId, exerciseId), eq(schema.submission.submittedBy, groupMemberId)))
      .orderBy(asc(schema.submission.createdAt));
  } catch (error) {
    console.error('getStudentExerciseSubmissions error:', error);
    throw new Error(
      `Failed to list submissions for exercise: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
