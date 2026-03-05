import * as schema from '@db/schema';

import { and, db, eq, or, sql } from '@db/drizzle';

/**
 * Mark record with fields in camelCase matching database schema convention.
 * Slim shape for gradebook: no lesson or profile data (students come from members API).
 */
export interface Mark {
  courseId: string;
  exerciseId: string;
  exerciseTitle: string;
  exercisePoints: number;
  statusId: number | null;
  totalPointsGotten: number | null;
  groupmemberId: string | null;
}

/**
 * Gets marks for a course
 * Converts the get_marks() PostgreSQL function to a Drizzle query
 * @param courseId Course ID
 * @returns Array of mark records
 */
export async function getMarksByCourseId(courseId: string): Promise<Mark[]> {
  try {
    const result = await db
      .select({
        courseId: schema.course.id,
        exerciseId: schema.exercise.id,
        exerciseTitle: schema.exercise.title,
        exercisePoints: sql<number>`COALESCE(SUM(${schema.question.points})::int, 0)`.as('exercisePoints'),
        statusId: schema.submission.statusId,
        totalPointsGotten: schema.submission.total,
        groupmemberId: schema.submission.submittedBy
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .innerJoin(
        schema.course,
        or(eq(schema.exercise.courseId, schema.course.id), eq(schema.lesson.courseId, schema.course.id))
      )
      .leftJoin(schema.submission, eq(schema.exercise.id, schema.submission.exerciseId))
      .innerJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
      .where(eq(schema.course.id, courseId))
      .groupBy(
        schema.exercise.id,
        schema.course.id,
        schema.exercise.title,
        schema.submission.statusId,
        schema.submission.total,
        schema.submission.submittedBy
      )
      .orderBy(schema.exercise.createdAt);

    return result.map((row) => ({
      courseId: row.courseId,
      exerciseId: row.exerciseId,
      exerciseTitle: row.exerciseTitle,
      exercisePoints: row.exercisePoints ?? 0,
      statusId: row.statusId ?? null,
      totalPointsGotten: row.totalPointsGotten ?? null,
      groupmemberId: row.groupmemberId ?? null
    }));
  } catch (error) {
    console.error('getMarksByCourseId error:', error);
    throw new Error(
      `Failed to get marks for course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
