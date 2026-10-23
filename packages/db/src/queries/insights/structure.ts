import * as schema from '@db/schema';
import { eq, inArray, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import type { InsightsExerciseMeta } from './types';

/**
 * Pass rules, lock state and max points for every exercise in the given courses, including legacy lesson-embedded ones.
 */
export async function getInsightsExerciseMeta(
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<InsightsExerciseMeta[]> {
  if (courseIds.length === 0) return [];

  try {
    return await dbClient
      .select({
        id: schema.exercise.id,
        courseId: sql<string>`COALESCE(${schema.exercise.courseId}, ${schema.lesson.courseId})`,
        completionPolicy: schema.exercise.completionPolicy,
        passThreshold: schema.exercise.passThreshold,
        isUnlocked: schema.exercise.isUnlocked,
        maxPoints: sql<number>`COALESCE(SUM(${schema.question.points}), 0)::float8`
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
      .where(or(inArray(schema.exercise.courseId, courseIds), inArray(schema.lesson.courseId, courseIds)))
      .groupBy(schema.exercise.id, schema.lesson.courseId);
  } catch (error) {
    console.error('getInsightsExerciseMeta error:', error);
    throw new Error(`Failed to load exercise metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
