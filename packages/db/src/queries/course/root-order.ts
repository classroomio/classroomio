import * as schema from '@db/schema';

import { and, eq, gte, isNull, max, ne, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Which entries share one run of positions. `outline`: sections plus lessons and exercises outside any section, the
 * top level of a grouped course. `items`: every lesson and exercise, the list of a course with grouping off.
 * `sections`: sections alone, which a course with grouping off does not show. Exercises inside a lesson are never
 * counted.
 */
export type CourseOrderScope = 'outline' | 'items' | 'sections';

function scopeParts(scope: CourseOrderScope) {
  return {
    hasSections: scope !== 'items',
    hasItems: scope !== 'sections',
    hasSectionItems: scope === 'items'
  };
}

/**
 * Highest order among a course's entries in `scope`, or 0 when it has none.
 */
export async function getLastCourseRootOrder(
  courseId: string,
  dbClient: DbOrTxClient = db,
  scope: CourseOrderScope = 'outline'
) {
  const { hasSections, hasItems, hasSectionItems } = scopeParts(scope);
  try {
    const [sectionRow] = hasSections
      ? await dbClient
          .select({ value: max(schema.courseSection.order) })
          .from(schema.courseSection)
          .where(eq(schema.courseSection.courseId, courseId))
      : [];
    const [lessonRow] = hasItems
      ? await dbClient
          .select({ value: max(schema.lesson.order) })
          .from(schema.lesson)
          .where(
            and(eq(schema.lesson.courseId, courseId), hasSectionItems ? undefined : isNull(schema.lesson.sectionId))
          )
      : [];
    const [exerciseRow] = hasItems
      ? await dbClient
          .select({ value: max(schema.exercise.order) })
          .from(schema.exercise)
          .where(
            and(
              eq(schema.exercise.courseId, courseId),
              hasSectionItems ? undefined : isNull(schema.exercise.sectionId),
              isNull(schema.exercise.lessonId)
            )
          )
      : [];

    const lastOrders = [sectionRow?.value, lessonRow?.value, exerciseRow?.value].map((value) => Number(value ?? 0));

    return Math.max(0, ...lastOrders);
  } catch (error) {
    console.error('getLastCourseRootOrder error:', error);
    throw new Error(`Failed to read top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Whether any entry in `scope` other than `excludeId` already sits at `order`.
 */
export async function isCourseRootOrderTaken(
  courseId: string,
  order: number,
  excludeId: string | null,
  dbClient: DbOrTxClient = db,
  scope: CourseOrderScope = 'outline'
) {
  const { hasSections, hasItems, hasSectionItems } = scopeParts(scope);
  try {
    const sections = hasSections
      ? await dbClient
          .select({ id: schema.courseSection.id })
          .from(schema.courseSection)
          .where(
            and(
              eq(schema.courseSection.courseId, courseId),
              eq(schema.courseSection.order, order),
              excludeId ? ne(schema.courseSection.id, excludeId) : undefined
            )
          )
          .limit(1)
      : [];
    const lessons = hasItems
      ? await dbClient
          .select({ id: schema.lesson.id })
          .from(schema.lesson)
          .where(
            and(
              eq(schema.lesson.courseId, courseId),
              hasSectionItems ? undefined : isNull(schema.lesson.sectionId),
              eq(schema.lesson.order, order),
              excludeId ? ne(schema.lesson.id, excludeId) : undefined
            )
          )
          .limit(1)
      : [];
    const exercises = hasItems
      ? await dbClient
          .select({ id: schema.exercise.id })
          .from(schema.exercise)
          .where(
            and(
              eq(schema.exercise.courseId, courseId),
              hasSectionItems ? undefined : isNull(schema.exercise.sectionId),
              isNull(schema.exercise.lessonId),
              eq(schema.exercise.order, order),
              excludeId ? ne(schema.exercise.id, excludeId) : undefined
            )
          )
          .limit(1)
      : [];

    return sections.length + lessons.length + exercises.length > 0;
  } catch (error) {
    console.error('isCourseRootOrderTaken error:', error);
    throw new Error(`Failed to check top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Moves every entry in `scope` at or after `fromOrder` down one position.
 */
export async function shiftCourseRootOrders(
  courseId: string,
  fromOrder: number,
  dbClient: DbOrTxClient = db,
  scope: CourseOrderScope = 'outline'
) {
  const { hasSections, hasItems, hasSectionItems } = scopeParts(scope);
  try {
    if (hasSections) {
      await dbClient
        .update(schema.courseSection)
        .set({ order: sql`${schema.courseSection.order} + 1` })
        .where(and(eq(schema.courseSection.courseId, courseId), gte(schema.courseSection.order, fromOrder)));
    }

    if (!hasItems) return;

    await dbClient
      .update(schema.lesson)
      .set({ order: sql`${schema.lesson.order} + 1` })
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          hasSectionItems ? undefined : isNull(schema.lesson.sectionId),
          gte(schema.lesson.order, fromOrder)
        )
      );
    await dbClient
      .update(schema.exercise)
      .set({ order: sql`${schema.exercise.order} + 1` })
      .where(
        and(
          eq(schema.exercise.courseId, courseId),
          hasSectionItems ? undefined : isNull(schema.exercise.sectionId),
          isNull(schema.exercise.lessonId),
          gte(schema.exercise.order, fromOrder)
        )
      );
  } catch (error) {
    console.error('shiftCourseRootOrders error:', error);
    throw new Error(`Failed to shift top-level order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
