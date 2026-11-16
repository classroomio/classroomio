import * as schema from '@db/schema';

import { and, db, eq } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface TCourseCommentCourseContext {
  courseId: string;
  courseTitle: string;
  organizationId: string;
  teamCommentsEnabled: boolean;
}

/**
 * The org that owns a course and whether that org has team comments switched on.
 * @returns null when the course is missing, deleted, or not owned by an organization.
 */
export async function getCourseCommentCourseContext(
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentCourseContext | null> {
  try {
    const [row] = await dbClient
      .select({
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        organizationId: schema.organization.id,
        customization: schema.organization.customization
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .innerJoin(schema.organization, eq(schema.organization.id, schema.group.organizationId))
      .where(and(eq(schema.course.id, courseId), eq(schema.course.status, 'ACTIVE')))
      .limit(1);

    if (!row) return null;

    return {
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      organizationId: row.organizationId,
      teamCommentsEnabled: row.customization?.apps?.teamComments !== false
    };
  } catch (error) {
    console.error('getCourseCommentCourseContext error:', error);
    throw new Error(
      `Failed to load comment context for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * The question, when it belongs to the exercise.
 */
export async function getExerciseQuestionForComment(
  exerciseId: string,
  questionId: number,
  dbClient: DbOrTxClient = db
): Promise<{ id: number; title: string } | null> {
  try {
    const [row] = await dbClient
      .select({ id: schema.question.id, title: schema.question.title })
      .from(schema.question)
      .where(and(eq(schema.question.id, questionId), eq(schema.question.exerciseId, exerciseId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getExerciseQuestionForComment error:', error);
    throw new Error(
      `Failed to load question "${questionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
