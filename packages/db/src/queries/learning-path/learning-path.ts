import * as schema from '@db/schema';

import { and, asc, desc, eq, inArray, isNull, notExists, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourse, TLearningPath, TLearningPathCourse, TLearningPathMember, TNewLearningPath } from '@db/types';
import { submissionMeetsCompletionPolicySql } from '../course/progression';
import { ROLE } from '@cio/utils/constants';

export type TLearningPathCourseRow = {
  pathCourseId: string;
  order: number;
  courseId: string;
  title: string;
  description: string | null;
  logo: string;
  bannerImage: string | null;
  slug: string | null;
  groupId: string | null;
  isPublished: boolean;
  /** `ACTIVE` unless the course was deleted. */
  status: string;
  metadata: TCourse['metadata'];
  addedAt: string;
  cost: number;
  currency: string;
  lessonCount: number;
  exerciseCount: number;
};

export type TLearningPathListRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: TLearningPath['status'];
  sequentialUnlock: boolean;
  selfEnrollment: boolean;
  updatedAt: string;
  courseCount: number;
  learnerCount: number;
  completedCount: number;
};

export type TProfileCourseProgressRow = {
  profileId: string;
  courseId: string;
  groupMemberId: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
  lessonsCount: number;
  lessonsCompleted: number;
  exercisesCount: number;
  exercisesCompleted: number;
};

export type TLearningPathMemberRow = {
  id: string;
  profileId: string;
  roleId: number;
  fullname: string;
  email: string | null;
  avatarUrl: string | null;
  enrolledAt: string;
  completedAt: string | null;
};

export type TLearnerPathRow = {
  path: TLearningPath;
  memberId: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
};

export type TPathMembershipForCourse = {
  pathId: string;
  pathName: string;
  sequentialUnlock: boolean;
  memberId: string;
  enrolledAt: string;
  completedAt: string | null;
};

const studentCountSql = sql<number>`(
  SELECT count(*)::int FROM ${schema.learningPathMember} AS lpm
  WHERE lpm.path_id = "learning_path"."id" AND lpm.role_id = ${ROLE.STUDENT}
)`;

const completedCountSql = sql<number>`(
  SELECT count(*)::int FROM ${schema.learningPathMember} AS lpm
  WHERE lpm.path_id = "learning_path"."id" AND lpm.role_id = ${ROLE.STUDENT} AND lpm.completed_at IS NOT NULL
)`;

const courseCountSql = sql<number>`(
  SELECT count(*)::int FROM ${schema.learningPathCourse} AS lpc
  WHERE lpc.path_id = "learning_path"."id"
)`;

const publishedCourseCountSql = sql<number>`(
  SELECT count(*)::int FROM ${schema.learningPathCourse} AS lpc
  INNER JOIN ${schema.course} AS pc ON pc.id = lpc.course_id
  WHERE lpc.path_id = "learning_path"."id" AND pc.is_published = true AND pc.status = 'ACTIVE'
)`;

const pathListColumns = {
  id: schema.learningPath.id,
  name: schema.learningPath.name,
  slug: schema.learningPath.slug,
  description: schema.learningPath.description,
  coverImage: schema.learningPath.coverImage,
  status: schema.learningPath.status,
  sequentialUnlock: schema.learningPath.sequentialUnlock,
  selfEnrollment: schema.learningPath.selfEnrollment,
  updatedAt: schema.learningPath.updatedAt
};

export async function listOrgLearningPaths(organizationId: string): Promise<TLearningPathListRow[]> {
  try {
    return await db
      .select({
        ...pathListColumns,
        courseCount: courseCountSql,
        learnerCount: studentCountSql,
        completedCount: completedCountSql
      })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.organizationId, organizationId))
      .orderBy(desc(schema.learningPath.updatedAt));
  } catch (error) {
    console.error('listOrgLearningPaths error:', error);
    throw new Error('Failed to list learning paths');
  }
}

export async function getLearningPathById(pathId: string, dbClient: DbOrTxClient = db): Promise<TLearningPath | null> {
  try {
    const [row] = await dbClient.select().from(schema.learningPath).where(eq(schema.learningPath.id, pathId)).limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLearningPathById error:', error);
    throw new Error('Failed to get learning path');
  }
}

export async function listLearningPathSlugs(organizationId: string, dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    const rows = await dbClient
      .select({ slug: schema.learningPath.slug })
      .from(schema.learningPath)
      .where(eq(schema.learningPath.organizationId, organizationId));

    return rows.map((row) => row.slug);
  } catch (error) {
    console.error('listLearningPathSlugs error:', error);
    throw new Error('Failed to list learning path slugs');
  }
}

export async function insertLearningPath(
  values: TNewLearningPath,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath> {
  try {
    const [row] = await dbClient.insert(schema.learningPath).values(values).returning();

    return row;
  } catch (error) {
    console.error('insertLearningPath error:', error);
    throw error;
  }
}

export async function updateLearningPath(
  pathId: string,
  values: Partial<TNewLearningPath>,
  dbClient: DbOrTxClient = db
): Promise<TLearningPath | null> {
  try {
    const updatedAt = new Date().toISOString();
    const [row] = await dbClient
      .update(schema.learningPath)
      .set({ ...values, updatedAt })
      .where(eq(schema.learningPath.id, pathId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('updateLearningPath error:', error);
    throw new Error('Failed to update learning path');
  }
}

export async function touchLearningPath(pathId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    const updatedAt = new Date().toISOString();
    await dbClient.update(schema.learningPath).set({ updatedAt }).where(eq(schema.learningPath.id, pathId));
  } catch (error) {
    console.error('touchLearningPath error:', error);
    throw new Error('Failed to update learning path');
  }
}

export async function deleteLearningPath(pathId: string): Promise<boolean> {
  try {
    const rows = await db
      .delete(schema.learningPath)
      .where(eq(schema.learningPath.id, pathId))
      .returning({ id: schema.learningPath.id });

    return rows.length > 0;
  } catch (error) {
    console.error('deleteLearningPath error:', error);
    throw new Error('Failed to delete learning path');
  }
}

export async function listLearningPathCourses(
  pathId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourseRow[]> {
  try {
    return await dbClient
      .select({
        pathCourseId: schema.learningPathCourse.id,
        order: schema.learningPathCourse.order,
        courseId: schema.course.id,
        title: schema.course.title,
        description: schema.course.description,
        logo: schema.course.logo,
        bannerImage: schema.course.bannerImage,
        slug: schema.course.slug,
        groupId: schema.course.groupId,
        isPublished: sql<boolean>`coalesce(${schema.course.isPublished}, false) AND ${schema.course.status} = 'ACTIVE'`,
        status: schema.course.status,
        metadata: schema.course.metadata,
        addedAt: schema.learningPathCourse.addedAt,
        cost: sql<number>`coalesce(${schema.course.cost}, 0)::int`,
        currency: schema.course.currency,
        lessonCount: sql<number>`(
          SELECT count(*)::int FROM ${schema.lesson} AS pl WHERE pl.course_id = "course"."id"
        )`,
        exerciseCount: sql<number>`(
          SELECT count(*)::int FROM ${schema.exercise} AS pe
          LEFT JOIN ${schema.lesson} AS pel ON pel.id = pe.lesson_id
          WHERE pe.course_id = "course"."id" OR pel.course_id = "course"."id"
        )`
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.course, eq(schema.course.id, schema.learningPathCourse.courseId))
      .where(eq(schema.learningPathCourse.pathId, pathId))
      .orderBy(asc(schema.learningPathCourse.order));
  } catch (error) {
    console.error('listLearningPathCourses error:', error);
    throw new Error('Failed to list learning path courses');
  }
}

export async function getMaxLearningPathCourseOrder(pathId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ maxOrder: sql<number>`coalesce(max(${schema.learningPathCourse.order}), 0)::int` })
      .from(schema.learningPathCourse)
      .where(eq(schema.learningPathCourse.pathId, pathId));

    return row?.maxOrder ?? 0;
  } catch (error) {
    console.error('getMaxLearningPathCourseOrder error:', error);
    throw new Error('Failed to read learning path course order');
  }
}

export async function insertLearningPathCourse(
  values: { pathId: string; courseId: string; order: number },
  dbClient: DbOrTxClient = db
): Promise<TLearningPathCourse | null> {
  try {
    const [row] = await dbClient
      .insert(schema.learningPathCourse)
      .values(values)
      .onConflictDoNothing({ target: [schema.learningPathCourse.pathId, schema.learningPathCourse.courseId] })
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('insertLearningPathCourse error:', error);
    throw new Error('Failed to add course to learning path');
  }
}

export async function deleteLearningPathCourse(
  pathId: string,
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const rows = await dbClient
      .delete(schema.learningPathCourse)
      .where(and(eq(schema.learningPathCourse.pathId, pathId), eq(schema.learningPathCourse.courseId, courseId)))
      .returning({ id: schema.learningPathCourse.id });

    return rows.length > 0;
  } catch (error) {
    console.error('deleteLearningPathCourse error:', error);
    throw new Error('Failed to remove course from learning path');
  }
}

/**
 * Writes `courseIds` as positions 1..n. Positions are first moved out of range so the
 * (path_id, order) unique constraint holds at every statement.
 */
export async function setLearningPathCourseOrder(
  pathId: string,
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient
      .update(schema.learningPathCourse)
      .set({ order: sql`-${schema.learningPathCourse.order}` })
      .where(eq(schema.learningPathCourse.pathId, pathId));

    for (const [index, courseId] of courseIds.entries()) {
      await dbClient
        .update(schema.learningPathCourse)
        .set({ order: index + 1 })
        .where(and(eq(schema.learningPathCourse.pathId, pathId), eq(schema.learningPathCourse.courseId, courseId)));
    }
  } catch (error) {
    console.error('setLearningPathCourseOrder error:', error);
    throw new Error('Failed to reorder learning path courses');
  }
}

export async function listLearningPathMembers(pathId: string): Promise<TLearningPathMemberRow[]> {
  try {
    return await db
      .select({
        id: schema.learningPathMember.id,
        profileId: schema.learningPathMember.profileId,
        roleId: schema.learningPathMember.roleId,
        fullname: schema.profile.fullname,
        email: schema.profile.email,
        avatarUrl: schema.profile.avatarUrl,
        enrolledAt: schema.learningPathMember.enrolledAt,
        completedAt: schema.learningPathMember.completedAt
      })
      .from(schema.learningPathMember)
      .innerJoin(schema.profile, eq(schema.profile.id, schema.learningPathMember.profileId))
      .where(eq(schema.learningPathMember.pathId, pathId))
      .orderBy(desc(schema.learningPathMember.enrolledAt));
  } catch (error) {
    console.error('listLearningPathMembers error:', error);
    throw new Error('Failed to list learning path members');
  }
}

export async function listLearningPathStudentProfileIds(
  pathId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  try {
    const rows = await dbClient
      .select({ profileId: schema.learningPathMember.profileId })
      .from(schema.learningPathMember)
      .where(and(eq(schema.learningPathMember.pathId, pathId), eq(schema.learningPathMember.roleId, ROLE.STUDENT)));

    return rows.map((row) => row.profileId);
  } catch (error) {
    console.error('listLearningPathStudentProfileIds error:', error);
    throw new Error('Failed to list learning path students');
  }
}

export async function getLearningPathMember(
  pathId: string,
  memberId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.learningPathMember)
      .where(and(eq(schema.learningPathMember.pathId, pathId), eq(schema.learningPathMember.id, memberId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLearningPathMember error:', error);
    throw new Error('Failed to get learning path member');
  }
}

export async function getLearningPathMemberByProfile(
  pathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.learningPathMember)
      .where(and(eq(schema.learningPathMember.pathId, pathId), eq(schema.learningPathMember.profileId, profileId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLearningPathMemberByProfile error:', error);
    throw new Error('Failed to get learning path member');
  }
}

export async function insertLearningPathMembersOnConflictDoNothing(
  values: { pathId: string; profileId: string; roleId: number }[],
  dbClient: DbOrTxClient = db
): Promise<TLearningPathMember[]> {
  if (values.length === 0) return [];

  try {
    return await dbClient.insert(schema.learningPathMember).values(values).onConflictDoNothing().returning();
  } catch (error) {
    console.error('insertLearningPathMembersOnConflictDoNothing error:', error);
    throw new Error('Failed to add learning path members');
  }
}

export async function deleteLearningPathMember(pathId: string, memberId: string): Promise<boolean> {
  try {
    const rows = await db
      .delete(schema.learningPathMember)
      .where(and(eq(schema.learningPathMember.pathId, pathId), eq(schema.learningPathMember.id, memberId)))
      .returning({ id: schema.learningPathMember.id });

    return rows.length > 0;
  } catch (error) {
    console.error('deleteLearningPathMember error:', error);
    throw new Error('Failed to remove learning path member');
  }
}

export async function markLearningPathMemberCompleted(memberId: string, completedAt: string): Promise<boolean> {
  try {
    const rows = await db
      .update(schema.learningPathMember)
      .set({ completedAt })
      .where(and(eq(schema.learningPathMember.id, memberId), isNull(schema.learningPathMember.completedAt)))
      .returning({ id: schema.learningPathMember.id });

    return rows.length > 0;
  } catch (error) {
    console.error('markLearningPathMemberCompleted error:', error);
    throw new Error('Failed to mark learning path complete');
  }
}

/**
 * Lesson and exercise completion counts per (profile, course), read with the same predicates as
 * `getCourseProgress` so a path's unlock rule agrees with course completion everywhere else.
 */
export async function listProfileCourseProgress(
  profileIds: string[],
  courseIds: string[]
): Promise<TProfileCourseProgressRow[]> {
  if (profileIds.length === 0 || courseIds.length === 0) return [];

  try {
    const profileIdArray = sql`ARRAY[${sql.join(
      profileIds.map((id) => sql`${id}`),
      sql`, `
    )}]::uuid[]`;
    const courseIdList = sql.join(
      courseIds.map((id) => sql`${id}`),
      sql`, `
    );
    const result = await db.execute<{
      profile_id: string;
      course_id: string;
      group_member_id: string | null;
      enrolled_at: string | null;
      completed_at: string | null;
      lessons_count: number;
      lessons_completed: number;
      exercises_count: number;
      exercises_completed: number;
    }>(sql`
      WITH path_course AS (
        SELECT c.id, c.group_id FROM ${schema.course} AS c WHERE c.id IN (${courseIdList})
      ),
      lesson_total AS (
        SELECT l.course_id, count(*)::int AS total
        FROM ${schema.lesson} AS l
        WHERE l.course_id IN (${courseIdList})
        GROUP BY l.course_id
      ),
      course_exercise AS (
        SELECT ex.id, COALESCE(ex.course_id, el.course_id) AS course_id
        FROM ${schema.exercise} AS ex
        LEFT JOIN ${schema.lesson} AS el ON el.id = ex.lesson_id
        WHERE COALESCE(ex.course_id, el.course_id) IN (${courseIdList})
      ),
      exercise_total AS (
        SELECT course_id, count(*)::int AS total FROM course_exercise GROUP BY course_id
      ),
      lesson_done AS (
        SELECT l.course_id, lc.profile_id, count(*)::int AS done
        FROM ${schema.lessonCompletion} AS lc
        INNER JOIN ${schema.lesson} AS l ON l.id = lc.lesson_id
        WHERE l.course_id IN (${courseIdList}) AND lc.profile_id = ANY(${profileIdArray}) AND lc.is_complete = true
        GROUP BY l.course_id, lc.profile_id
      ),
      exercise_done AS (
        SELECT ce.course_id, sgm.profile_id, count(DISTINCT ex.id)::int AS done
        FROM course_exercise AS ce
        INNER JOIN ${schema.exercise} AS ex ON ex.id = ce.id
        INNER JOIN ${schema.submission} AS cs ON cs.exercise_id = ex.id
        INNER JOIN ${schema.groupmember} AS sgm ON sgm.id = cs.submitted_by
        WHERE sgm.profile_id = ANY(${profileIdArray}) AND ${submissionMeetsCompletionPolicySql('ex', 'cs')}
        GROUP BY ce.course_id, sgm.profile_id
      )
      SELECT
        p.profile_id,
        c.id AS course_id,
        gm.id AS group_member_id,
        gm.created_at AS enrolled_at,
        gm.completed_at,
        COALESCE(lt.total, 0) AS lessons_count,
        COALESCE(ld.done, 0) AS lessons_completed,
        COALESCE(et.total, 0) AS exercises_count,
        COALESCE(ed.done, 0) AS exercises_completed
      FROM unnest(${profileIdArray}) AS p(profile_id)
      CROSS JOIN path_course AS c
      LEFT JOIN ${schema.groupmember} AS gm ON gm.group_id = c.group_id AND gm.profile_id = p.profile_id
      LEFT JOIN lesson_total AS lt ON lt.course_id = c.id
      LEFT JOIN exercise_total AS et ON et.course_id = c.id
      LEFT JOIN lesson_done AS ld ON ld.course_id = c.id AND ld.profile_id = p.profile_id
      LEFT JOIN exercise_done AS ed ON ed.course_id = c.id AND ed.profile_id = p.profile_id
    `);

    return result.map((row) => ({
      profileId: row.profile_id,
      courseId: row.course_id,
      groupMemberId: row.group_member_id,
      enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : null,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      lessonsCount: Number(row.lessons_count),
      lessonsCompleted: Number(row.lessons_completed),
      exercisesCount: Number(row.exercises_count),
      exercisesCompleted: Number(row.exercises_completed)
    }));
  } catch (error) {
    console.error('listProfileCourseProgress error:', error);
    throw new Error('Failed to read course progress');
  }
}

/** ACTIVE paths in the organization the profile belongs to. */
export async function listEnrolledLearningPaths(organizationId: string, profileId: string): Promise<TLearnerPathRow[]> {
  try {
    const rows = await db
      .select({
        path: schema.learningPath,
        memberId: schema.learningPathMember.id,
        enrolledAt: schema.learningPathMember.enrolledAt,
        completedAt: schema.learningPathMember.completedAt
      })
      .from(schema.learningPathMember)
      .innerJoin(schema.learningPath, eq(schema.learningPath.id, schema.learningPathMember.pathId))
      .where(
        and(
          eq(schema.learningPath.organizationId, organizationId),
          eq(schema.learningPath.status, 'ACTIVE'),
          eq(schema.learningPathMember.profileId, profileId)
        )
      )
      .orderBy(desc(schema.learningPathMember.enrolledAt));

    return rows;
  } catch (error) {
    console.error('listEnrolledLearningPaths error:', error);
    throw new Error('Failed to list enrolled learning paths');
  }
}

/** ACTIVE self-enrollable paths with at least one published course that the profile has not joined. */
export async function listExplorableLearningPaths(
  organizationId: string,
  profileId: string
): Promise<(Omit<TLearningPathListRow, 'learnerCount' | 'completedCount'> & { cost: number; currency: string })[]> {
  try {
    const rows = await db
      .select({
        ...pathListColumns,
        cost: schema.learningPath.cost,
        currency: schema.learningPath.currency,
        courseCount: publishedCourseCountSql
      })
      .from(schema.learningPath)
      .where(
        and(
          eq(schema.learningPath.organizationId, organizationId),
          eq(schema.learningPath.status, 'ACTIVE'),
          eq(schema.learningPath.selfEnrollment, true),
          notExists(
            db
              .select({ id: schema.learningPathMember.id })
              .from(schema.learningPathMember)
              .where(
                and(
                  eq(schema.learningPathMember.pathId, schema.learningPath.id),
                  eq(schema.learningPathMember.profileId, profileId)
                )
              )
          )
        )
      )
      .orderBy(desc(schema.learningPath.updatedAt));

    return rows.filter((row) => row.courseCount > 0);
  } catch (error) {
    console.error('listExplorableLearningPaths error:', error);
    throw new Error('Failed to list learning paths');
  }
}

/** ACTIVE paths containing `courseId` that the profile is a member of. */
export async function listPathMembershipsForCourse(
  courseId: string,
  profileId: string
): Promise<TPathMembershipForCourse[]> {
  try {
    return await db
      .select({
        pathId: schema.learningPath.id,
        pathName: schema.learningPath.name,
        sequentialUnlock: schema.learningPath.sequentialUnlock,
        memberId: schema.learningPathMember.id,
        enrolledAt: schema.learningPathMember.enrolledAt,
        completedAt: schema.learningPathMember.completedAt
      })
      .from(schema.learningPathCourse)
      .innerJoin(schema.learningPath, eq(schema.learningPath.id, schema.learningPathCourse.pathId))
      .innerJoin(
        schema.learningPathMember,
        and(
          eq(schema.learningPathMember.pathId, schema.learningPath.id),
          eq(schema.learningPathMember.profileId, profileId)
        )
      )
      .where(and(eq(schema.learningPathCourse.courseId, courseId), eq(schema.learningPath.status, 'ACTIVE')));
  } catch (error) {
    console.error('listPathMembershipsForCourse error:', error);
    throw new Error('Failed to read learning path memberships');
  }
}

/** Org courses for the course picker, flagged when already in the path. */
export async function listOrgCoursesForLearningPath(organizationId: string, pathId: string) {
  try {
    return await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        logo: schema.course.logo,
        isPublished: sql<boolean>`coalesce(${schema.course.isPublished}, false)`,
        inPath: sql<boolean>`EXISTS (
          SELECT 1 FROM ${schema.learningPathCourse} AS lpc
          WHERE lpc.path_id = ${pathId} AND lpc.course_id = "course"."id"
        )`
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(
        and(
          eq(schema.group.organizationId, organizationId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isTemplate, false)
        )
      )
      .orderBy(asc(schema.course.title));
  } catch (error) {
    console.error('listOrgCoursesForLearningPath error:', error);
    throw new Error('Failed to list organization courses');
  }
}

export async function getCourseOrganizationIds(
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<{ courseId: string; organizationId: string | null; groupId: string | null; status: string }[]> {
  if (courseIds.length === 0) return [];

  try {
    return await dbClient
      .select({
        courseId: schema.course.id,
        organizationId: schema.group.organizationId,
        groupId: schema.course.groupId,
        status: schema.course.status
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(inArray(schema.course.id, courseIds));
  } catch (error) {
    console.error('getCourseOrganizationIds error:', error);
    throw new Error('Failed to read course organizations');
  }
}
