import * as schema from '@db/schema';

import { and, eq, gte, isNull, max, ne, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Highest order among a course's top-level outline entries (sections, and lessons or exercises outside any
 * section or lesson), or 0 when the course has none.
 */
export async function getLastCourseRootOrder(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    const [sectionRow] = await dbClient
      .select({ value: max(schema.courseSection.order) })
      .from(schema.courseSection)
      .where(eq(schema.courseSection.courseId, courseId));
    const [lessonRow] = await dbClient
      .select({ value: max(schema.lesson.order) })
      .from(schema.lesson)
      .where(and(eq(schema.lesson.courseId, courseId), isNull(schema.lesson.sectionId)));
    const [exerciseRow] = await dbClient
      .select({ value: max(schema.exercise.order) })
      .from(schema.exercise)
      .where(
        and(eq(schema.exercise.courseId, courseId), isNull(schema.exercise.sectionId), isNull(schema.exercise.lessonId))
      );

    const lastOrders = [sectionRow?.value, lessonRow?.value, exerciseRow?.value].map((value) => Number(value ?? 0));

    return Math.max(0, ...lastOrders);
  } catch (error) {
    console.error('getLastCourseRootOrder error:', error);
    throw new Error(`Failed to read top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Whether any top-level outline entry other than `excludeId` already sits at `order`.
 */
export async function isCourseRootOrderTaken(
  courseId: string,
  order: number,
  excludeId: string | null,
  dbClient: DbOrTxClient = db
) {
  try {
    const sections = await dbClient
      .select({ id: schema.courseSection.id })
      .from(schema.courseSection)
      .where(
        and(
          eq(schema.courseSection.courseId, courseId),
          eq(schema.courseSection.order, order),
          excludeId ? ne(schema.courseSection.id, excludeId) : undefined
        )
      )
      .limit(1);
    const lessons = await dbClient
      .select({ id: schema.lesson.id })
      .from(schema.lesson)
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          isNull(schema.lesson.sectionId),
          eq(schema.lesson.order, order),
          excludeId ? ne(schema.lesson.id, excludeId) : undefined
        )
      )
      .limit(1);
    const exercises = await dbClient
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .where(
        and(
          eq(schema.exercise.courseId, courseId),
          isNull(schema.exercise.sectionId),
          isNull(schema.exercise.lessonId),
          eq(schema.exercise.order, order),
          excludeId ? ne(schema.exercise.id, excludeId) : undefined
        )
      )
      .limit(1);

    return sections.length + lessons.length + exercises.length > 0;
  } catch (error) {
    console.error('isCourseRootOrderTaken error:', error);
    throw new Error(`Failed to check top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Moves every top-level outline entry (sections, and lessons or exercises outside any section or lesson)
 * at or after `fromOrder` down one position.
 */
export async function shiftCourseRootOrders(courseId: string, fromOrder: number, dbClient: DbOrTxClient = db) {
  try {
    await dbClient
      .update(schema.courseSection)
      .set({ order: sql`${schema.courseSection.order} + 1` })
      .where(and(eq(schema.courseSection.courseId, courseId), gte(schema.courseSection.order, fromOrder)));
    await dbClient
      .update(schema.lesson)
      .set({ order: sql`${schema.lesson.order} + 1` })
      .where(
        and(eq(schema.lesson.courseId, courseId), isNull(schema.lesson.sectionId), gte(schema.lesson.order, fromOrder))
      );
    await dbClient
      .update(schema.exercise)
      .set({ order: sql`${schema.exercise.order} + 1` })
      .where(
        and(
          eq(schema.exercise.courseId, courseId),
          isNull(schema.exercise.sectionId),
          isNull(schema.exercise.lessonId),
          gte(schema.exercise.order, fromOrder)
        )
      );
  } catch (error) {
    console.error('shiftCourseRootOrders error:', error);
    throw new Error(`Failed to shift top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
