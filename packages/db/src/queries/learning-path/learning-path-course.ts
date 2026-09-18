import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import type { TLearningPath, TLearningPathCourse } from '../../types';

export interface TLearningPathCourseDetail {
  id: string;
  learningPathId: string;
  courseId: string;
  order: number;
  outcomes: string[];
  addedAt: string;
  title: string;
  description: string;
  cost: number;
  currency: string;
  coverImage: string | null;
  lessonsCount: number;
  exercisesCount: number;
}

/**
 * Lists active courses in a learning path in order, joined with course details and item counts.
 * Soft-removed rows are excluded; their progress cache is preserved for re-adds.
 */
export async function listLearningPathCourses(
  learningPathId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourseDetail[]> {
  try {
    const lessonsCountSql = sql<number>`
      COALESCE(
        (SELECT COUNT(*)::int
         FROM ${schema.lesson}
         WHERE ${eq(schema.lesson.courseId, schema.course.id)}),
        0
      )
    `.as('lessonsCount');

    const exercisesCountSql = sql<number>`
      COALESCE(
        (SELECT COUNT(*)::int
         FROM ${schema.exercise}
         WHERE ${eq(schema.exercise.courseId, schema.course.id)}),
        0
      )
    `.as('exercisesCount');

    const rows = await dbClient
      .select({
        id: schema.learningPathCourse.id,
        learningPathId: schema.learningPathCourse.learningPathId,
        courseId: schema.learningPathCourse.courseId,
        order: schema.learningPathCourse.order,
        outcomes: schema.learningPathCourse.outcomes,
        addedAt: schema.learningPathCourse.addedAt,
        title: schema.course.title,
        description: schema.course.description,
        cost: schema.course.cost,
        currency: schema.course.currency,
        coverImage: schema.course.bannerImage,
        lessonsCount: lessonsCountSql,
        exercisesCount: exercisesCountSql
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    return rows.map((row) => ({
      ...row,
      cost: Number(row.cost || 0),
      coverImage: row.coverImage ?? null,
      outcomes: (row.outcomes as string[]) || [],
      lessonsCount: Number(row.lessonsCount || 0),
      exercisesCount: Number(row.exercisesCount || 0)
    }));
  } catch (error) {
    console.error('listLearningPathCourses error:', error);
    throw new Error(
      `Failed to list courses for learning path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Appends a course to the end of a learning path atomically.
 * Re-adds a soft-removed row when present so prior member progress cache is preserved.
 */
export async function addCourseToPath(
  learningPathId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourse> {
  try {
    return await dbClient.transaction(async (tx) => {
      // 1. Check if the record already exists
      const [existingRow] = await tx
        .select()
        .from(schema.learningPathCourse)
        .where(
          and(
            eq(schema.learningPathCourse.learningPathId, learningPathId),
            eq(schema.learningPathCourse.courseId, courseId)
          )
        )
        .limit(1);

      // If it already exists and is active, return it immediately
      if (existingRow && !existingRow.removedAt) {
        return existingRow;
      }

      // 2. Lock the learning path row to serialize concurrent order allocation
      await tx
        .select({ id: schema.learningPath.id })
        .from(schema.learningPath)
        .where(eq(schema.learningPath.id, learningPathId))
        .for('update');

      // 3. Calculate the next order atomically within the transaction
      const [maxRow] = await tx
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${schema.learningPathCourse.order}), 0)::int`
        })
        .from(schema.learningPathCourse)
        .where(
          and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
        );

      const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

      // 4. If it exists and was soft-deleted, update it directly by ID
      if (existingRow) {
        const [restored] = await tx
          .update(schema.learningPathCourse)
          .set({ order: nextOrder, removedAt: null })
          .where(eq(schema.learningPathCourse.id, existingRow.id))
          .returning();

        if (!restored) {
          throw new Error('Failed to re-add course to learning path');
        }
        return restored;
      }

      // 5. Otherwise, insert a new record.
      // onConflictDoUpdate acts as a bulletproof safety net against concurrent race conditions.
      const [created] = await tx
        .insert(schema.learningPathCourse)
        .values({
          learningPathId,
          courseId,
          order: nextOrder
        })
        .onConflictDoUpdate({
          target: [schema.learningPathCourse.learningPathId, schema.learningPathCourse.courseId],
          set: {
            order: nextOrder,
            removedAt: null
          }
        })
        .returning();

      if (!created) {
        throw new Error('Failed to add course to learning path');
      }

      return created;
    });
  } catch (error) {
    console.error('addCourseToPath error:', error);
    throw new Error(
      `Failed to add course to learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Adds multiple courses to a learning path sequentially.
 */
export async function addCoursesToPath(
  learningPathId: string,
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourse[]> {
  try {
    const addedCourses: TLearningPathCourse[] = [];

    for (const courseId of courseIds) {
      const row = await addCourseToPath(learningPathId, courseId, dbClient);
      addedCourses.push(row);
    }

    return addedCourses;
  } catch (error) {
    console.error('addCoursesToPath error:', error);
    throw new Error(
      `Failed to add courses to learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Soft-removes a course from a learning path and recompacts subsequent orders.
 * Preserves member progress cache, enrollments, and the course entity so
 * re-adding the course restores prior progress.
 */
export async function removeCourseFromPath(
  learningPathId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourse | null> {
  try {
    const [removed] = await dbClient
      .update(schema.learningPathCourse)
      .set({ removedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          eq(schema.learningPathCourse.courseId, courseId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .returning();

    if (!removed) {
      return null;
    }

    const remaining = await dbClient
      .select({ id: schema.learningPathCourse.id })
      .from(schema.learningPathCourse)
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    for (let index = 0; index < remaining.length; index++) {
      await dbClient
        .update(schema.learningPathCourse)
        .set({ order: index + 1 })
        .where(eq(schema.learningPathCourse.id, remaining[index].id));
    }

    return removed;
  } catch (error) {
    console.error('removeCourseFromPath error:', error);
    throw new Error(
      `Failed to remove course from learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Reorders courses in a learning path to match the array order.
 * Validates the submission is an exact permutation of the path's active
 * courses, then applies all order changes atomically. Safe to call inside an
 * outer transaction (reuses the provided client) or standalone.
 */
export async function reorderLearningPathCourses(
  learningPathId: string,
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  const applyReorder = async (client: DbOrTxClient): Promise<void> => {
    const existingRows = await client
      .select({ courseId: schema.learningPathCourse.courseId })
      .from(schema.learningPathCourse)
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      );

    const existingIds = existingRows.map((row) => row.courseId);
    const existingSet = new Set(existingIds);
    const submittedSet = new Set(courseIds);

    if (
      courseIds.length !== existingIds.length ||
      submittedSet.size !== courseIds.length ||
      !courseIds.every((id) => existingSet.has(id))
    ) {
      throw new Error(
        `Cannot reorder learning path "${learningPathId}": submitted courses must be an exact permutation of the path's courses`
      );
    }

    for (let index = 0; index < courseIds.length; index++) {
      const courseId = courseIds[index];
      const newOrder = index + 1;

      await client
        .update(schema.learningPathCourse)
        .set({ order: newOrder })
        .where(
          and(
            eq(schema.learningPathCourse.learningPathId, learningPathId),
            eq(schema.learningPathCourse.courseId, courseId)
          )
        );
    }
  };

  if (dbClient !== db) {
    try {
      await applyReorder(dbClient);
    } catch (error) {
      console.error('reorderLearningPathCourses error:', error);
      throw new Error(
        `Failed to reorder learning path courses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return;
  }

  try {
    await db.transaction(applyReorder);
  } catch (error) {
    console.error('reorderLearningPathCourses error:', error);
    throw new Error(
      `Failed to reorder learning path courses: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns ordered list of active course UUIDs in a learning path.
 */
export async function getCourseIdsInPath(learningPathId: string, dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    const rows = await dbClient
      .select({ courseId: schema.learningPathCourse.courseId })
      .from(schema.learningPathCourse)
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    return rows.map((r) => r.courseId);
  } catch (error) {
    console.error('getCourseIdsInPath error:', error);
    throw new Error(
      `Failed to get course ids in learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if a specific active course belongs to a learning path.
 */
export async function isCourseInPath(
  learningPathId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.learningPathCourse.id })
      .from(schema.learningPathCourse)
      .where(
        and(
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          eq(schema.learningPathCourse.courseId, courseId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isCourseInPath error:', error);
    throw new Error(
      `Failed to check if course is in path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns learning paths containing the given course that the member is actively enrolled in.
 */
export async function getPathsContainingCourseForMember(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath[]> {
  try {
    const rows = await dbClient
      .select({
        learningPath: schema.learningPath
      })
      .from(schema.learningPath)
      .innerJoin(schema.learningPathCourse, eq(schema.learningPathCourse.learningPathId, schema.learningPath.id))
      .innerJoin(schema.learningPathMember, eq(schema.learningPathMember.learningPathId, schema.learningPath.id))
      .where(
        and(
          eq(schema.learningPathCourse.courseId, courseId),
          isNull(schema.learningPathCourse.removedAt),
          eq(schema.learningPathMember.profileId, profileId),
          isNull(schema.learningPathMember.removedAt)
        )
      );

    return rows.map((r) => r.learningPath);
  } catch (error) {
    console.error('getPathsContainingCourseForMember error:', error);
    throw new Error(
      `Failed to get paths containing course for member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates course details within a learning path (such as learning outcomes).
 */
export async function updateLearningPathCourse(
  learningPathId: string,
  courseId: string,
  data: Partial<Pick<TLearningPathCourse, 'outcomes'>>,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourse | null> {
  try {
    const [updated] = await dbClient
      .update(schema.learningPathCourse)
      .set(data)
      .where(
        and(
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          eq(schema.learningPathCourse.courseId, courseId),
          isNull(schema.learningPathCourse.removedAt)
        )
      )
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateLearningPathCourse error:', error);
    throw new Error(
      `Failed to update course in learning path: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
