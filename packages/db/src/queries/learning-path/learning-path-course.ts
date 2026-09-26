import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { INSTRUCTOR_ROLE_LABEL, ROLE } from '@cio/utils/constants';

import * as schema from '../../schema';
import type { TLearningPath, TLearningPathCourse } from '../../types';

export interface TLearningPathCourseDetail {
  id: string;
  learningPathId: string;
  courseId: string;
  order: number;
  addedAt: string;
  title: string;
  description: string;
  cost: number;
  currency: string;
  coverImage: string | null;
  lessonsCount: number;
  exercisesCount: number;
  instructor?: {
    name?: string;
    role?: string;
    imgUrl?: string;
  } | null;
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
        addedAt: schema.learningPathCourse.addedAt,
        title: schema.course.title,
        description: schema.course.description,
        cost: schema.course.cost,
        currency: schema.course.currency,
        coverImage: schema.course.bannerImage,
        metadata: schema.course.metadata,
        groupId: schema.course.groupId,
        lessonsCount: lessonsCountSql,
        exercisesCount: exercisesCountSql
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.course, eq(schema.learningPathCourse.courseId, schema.course.id))
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    const missingGroupIds = [
      ...new Set(
        rows
          .filter((row) => {
            const instructor = (row.metadata as Record<string, unknown>)?.instructor as { name?: string } | undefined;
            return !instructor?.name && row.groupId;
          })
          .map((row) => row.groupId as string)
      )
    ];

    const teacherMap = new Map<string, { name: string; role: string; imgUrl: string }>();

    if (missingGroupIds.length > 0) {
      const teachers = await dbClient
        .select({
          groupId: schema.groupmember.groupId,
          roleId: schema.groupmember.roleId,
          fullname: schema.profile.fullname,
          avatarUrl: schema.profile.avatarUrl
        })
        .from(schema.groupmember)
        .innerJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
        .where(
          and(
            inArray(schema.groupmember.groupId, missingGroupIds),
            inArray(schema.groupmember.roleId, [ROLE.TUTOR, ROLE.ADMIN])
          )
        )
        .orderBy(
          sql`CASE WHEN ${schema.groupmember.roleId} = ${ROLE.TUTOR} THEN 0 ELSE 1 END`,
          asc(schema.groupmember.createdAt)
        );

      for (const teacher of teachers) {
        if (!teacher.groupId || !teacher.fullname) continue;

        const current = teacherMap.get(teacher.groupId);
        if (!current || (current.role === INSTRUCTOR_ROLE_LABEL.INSTRUCTOR && teacher.roleId === ROLE.TUTOR)) {
          teacherMap.set(teacher.groupId, {
            name: teacher.fullname,
            role: teacher.roleId === ROLE.TUTOR ? INSTRUCTOR_ROLE_LABEL.TUTOR : INSTRUCTOR_ROLE_LABEL.INSTRUCTOR,
            imgUrl: teacher.avatarUrl ?? ''
          });
        }
      }
    }

    return rows.map((row) => {
      const explicit = (row.metadata as Record<string, unknown>)?.instructor as {
        name?: string;
        role?: string;
        imgUrl?: string;
      } | null;

      const fallback = row.groupId ? (teacherMap.get(row.groupId) ?? null) : null;
      const instructor = (explicit?.name ? explicit : fallback) ?? null;

      return {
        ...row,
        cost: Number(row.cost || 0),
        coverImage: row.coverImage ?? null,
        lessonsCount: Number(row.lessonsCount || 0),
        exercisesCount: Number(row.exercisesCount || 0),
        instructor
      };
    });
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
  const run = async (tx: DbOrTxClient): Promise<TLearningPathCourse> => {
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
  };

  try {
    return await (dbClient === db ? db.transaction(run) : run(dbClient));
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
  const runAll = async (tx: DbOrTxClient): Promise<TLearningPathCourse[]> => {
    const addedCourses: TLearningPathCourse[] = [];

    for (const courseId of courseIds) {
      const row = await addCourseToPath(learningPathId, courseId, tx);
      addedCourses.push(row);
    }

    return addedCourses;
  };

  try {
    return await (dbClient === db ? db.transaction(runAll) : runAll(dbClient));
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
  const run = async (tx: DbOrTxClient): Promise<TLearningPathCourse | null> => {
    const [removed] = await tx
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

    const remaining = await tx
      .select({ id: schema.learningPathCourse.id })
      .from(schema.learningPathCourse)
      .where(
        and(eq(schema.learningPathCourse.learningPathId, learningPathId), isNull(schema.learningPathCourse.removedAt))
      )
      .orderBy(asc(schema.learningPathCourse.order));

    if (remaining.length > 0) {
      const orderCase = sql<number>`(CASE ${schema.learningPathCourse.id} ${sql.join(
        remaining.map((row, index) => sql`WHEN ${row.id} THEN ${index + 1}::integer`),
        sql` `
      )} END)::integer`;

      await tx
        .update(schema.learningPathCourse)
        .set({ order: orderCase })
        .where(
          and(
            eq(schema.learningPathCourse.learningPathId, learningPathId),
            inArray(
              schema.learningPathCourse.id,
              remaining.map((row) => row.id)
            )
          )
        );
    }

    return removed;
  };

  try {
    return await (dbClient === db ? db.transaction(run) : run(dbClient));
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

    const orderCase = sql<number>`(CASE ${schema.learningPathCourse.courseId} ${sql.join(
      courseIds.map((courseId, index) => sql`WHEN ${courseId} THEN ${index + 1}::integer`),
      sql` `
    )} END)::integer`;

    await client
      .update(schema.learningPathCourse)
      .set({ order: orderCase })
      .where(
        and(
          eq(schema.learningPathCourse.learningPathId, learningPathId),
          inArray(schema.learningPathCourse.courseId, courseIds)
        )
      );
  };

  try {
    return await (dbClient === db ? db.transaction(applyReorder) : applyReorder(dbClient));
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
          isNull(schema.learningPathMember.removedAt),
          eq(schema.learningPath.status, 'ACTIVE')
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
