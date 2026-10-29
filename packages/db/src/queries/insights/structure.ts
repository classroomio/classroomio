import * as schema from '@db/schema';
import { eq, inArray, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import type { InsightsExerciseMeta } from './types';

/**
 * Pass rules, lock state and max points for every exercise in the given courses.
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
        courseId: sql<string>`COALESCE(${schema.exercise.courseId}, ${schema.courseSection.courseId})`,
        completionPolicy: schema.exercise.completionPolicy,
        passThreshold: schema.exercise.passThreshold,
        isUnlocked: schema.exercise.isUnlocked,
        maxPoints: sql<number>`COALESCE(SUM(${schema.question.points}), 0)::float8`
      })
      .from(schema.exercise)
      .leftJoin(schema.courseSection, eq(schema.exercise.sectionId, schema.courseSection.id))
      .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
      .where(or(inArray(schema.exercise.courseId, courseIds), inArray(schema.courseSection.courseId, courseIds)))
      .groupBy(schema.exercise.id, schema.courseSection.courseId);
  } catch (error) {
    console.error('getInsightsExerciseMeta error:', error);
    throw new Error(`Failed to load exercise metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
