import * as schema from '@db/schema';

import {
  TCourse,
  TCourseSection,
  TGroup,
  TGroupAttendance,
  TGroupmember,
  TNewCourse,
  TNewCourseNewsfeed,
  TNewCourseSection,
  TProfile
} from '@db/types';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';
import { getCourseContentItems, type CourseContentItemRow } from './content';

/**
 * Base course type - extends TCourse with lessonCount
 * Used by public endpoint for landing pages
 */
export interface TBaseCourse extends TCourse {
  lessonCount: number;
}

/**
 * Admin/Tutor course type - extends TBaseCourse with totalStudents
 * Used for admin and tutor dashboard views
 */
export interface TAdminCourse extends TBaseCourse {
  totalStudents: number;
}

/**
 * Student course type - extends TBaseCourse with progressRate
 * Used for student dashboard and enrolled courses views
 */
export interface TStudentCourse extends TBaseCourse {
  progressRate: number;
}

/**
 * Gets published courses by organization siteName
 * @param siteName Organization site name
 * @returns Array of published courses with lesson counts
 */
export const getPublishedCoursesBySiteName = async (siteName: string): Promise<TBaseCourse[]> => {
  try {
    const result = await db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(${schema.lesson.id})`.as('lesson_count')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(
          eq(schema.organization.siteName, siteName),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true)
        )
      )
      .groupBy(schema.course.id)
      .orderBy(desc(schema.course.createdAt));

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount)
    }));
  } catch (error) {
    throw new Error(
      `Failed to get courses by site name "${siteName}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Gets courses by organization orgId
 * @param orgId Organization orgId
 * @returns Array of courses with lesson counts and organization info
 */
export const getCoursesById = async (orgId: string): Promise<TCourse[]> => {
  try {
    const result = await db
      .select({
        course: schema.course,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          avatarUrl: schema.organization.avatarUrl
        },
        lessonCount: sql<number>`COUNT(${schema.lesson.id})`.as('lesson_count')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(eq(schema.organization.id, orgId), eq(schema.course.status, 'ACTIVE'), eq(schema.course.isPublished, true))
      )
      .groupBy(
        schema.course.id,
        schema.organization.id,
        schema.organization.name,
        schema.organization.siteName,
        schema.organization.avatarUrl
      );

    return result.map((row) => ({
      ...row.course,
      lessons: [{ count: Number(row.lessonCount) }],
      group: {
        organization: row.organization
      }
    }));
  } catch (error) {
    throw new Error(
      `Failed to get courses by org ID "${orgId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Gets lessons by organization siteName
 * @param siteName Organization site name
 * @returns Array of lessons
 */
export const getLessonsBySiteName = async (siteName: string) => {
  const result = await db
    .select({
      lesson: schema.lesson
    })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  return result.map((row) => row.lesson);
};

/**
 * Gets exercises by organization siteName
 * @param siteName Organization site name
 * @returns Array of exercises
 */
export const getExercisesBySiteName = async (siteName: string) => {
  const result = await db
    .select({
      exercise: schema.exercise
    })
    .from(schema.exercise)
    .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
    .innerJoin(
      schema.course,
      or(eq(schema.exercise.courseId, schema.course.id), eq(schema.lesson.courseId, schema.course.id))
    )
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  return result.map((row) => row.exercise);
};

/**
 * Gets courses by organization siteName (for setup - includes unpublished courses)
 * @param siteName Organization site name
 * @returns Array of courses with organization info
 */
export const getCoursesBySiteNameForSetup = async (siteName: string) => {
  const result = await db
    .select({
      course: schema.course
    })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  return result.map((row) => ({
    ...row.course
  }));
};
export async function getCourseById(courseId: string) {
  try {
    return await db.select().from(schema.course).where(eq(schema.course.id, courseId)).limit(1);
  } catch (error) {
    throw new Error(
      `Failed to get course by ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets a course by ID or slug with related data (group, attendance, content items).
 * @param courseId Course ID (optional if slug provided)
 * @param slug Course slug (optional if courseId provided)
 * @param profileId Profile ID of the current user (optional)
 * @returns Course with related data or null if not found
 */
export type CourseWithRelations = TCourse & {
  group:
    | (TGroup & {
        members: (TGroupmember & {
          profile: Pick<TProfile, 'id' | 'fullname' | 'username' | 'avatarUrl' | 'email'> | null;
        })[];
      })
    | null;
  attendance: TGroupAttendance[];
  contentItems: CourseContentItemRow[];
  /** Set when course has groupId (from join on group -> organization) */
  org?: {
    id: string;
    name: string;
    siteName: string | null;
    theme: string | null;
  } | null;
};

export async function getCourseWithRelations(
  courseId?: string,
  slug?: string,
  profileId?: string
): Promise<CourseWithRelations | null> {
  try {
    if (!courseId && !slug) {
      throw new Error('Either courseId or slug must be provided');
    }

    // Get course
    const courseQuery = slug
      ? db
          .select()
          .from(schema.course)
          .where(and(eq(schema.course.slug, slug), eq(schema.course.status, 'ACTIVE')))
      : db
          .select()
          .from(schema.course)
          .where(and(eq(schema.course.id, courseId!), eq(schema.course.status, 'ACTIVE')));

    const courses = await courseQuery.limit(1);
    if (courses.length === 0) {
      return null;
    }

    const course = courses[0];
    const finalCourseId = course.id;

    // Type definitions for query results (group query joins organization for org context)
    type GroupQueryRow = {
      group: TGroup;
      member: TGroupmember | null;
      profile: Pick<TProfile, 'id' | 'fullname' | 'username' | 'avatarUrl' | 'email'> | null;
      organization: {
        id: string;
        name: string;
        siteName: string | null;
        theme: string | null;
      } | null;
    };
    // Fetch group data (and org via join) if groupId exists
    const groupDataPromise: Promise<GroupQueryRow[]> = course.groupId
      ? db
          .select({
            group: schema.group,
            member: schema.groupmember,
            profile: {
              id: schema.profile.id,
              fullname: schema.profile.fullname,
              username: schema.profile.username,
              avatarUrl: schema.profile.avatarUrl,
              email: schema.profile.email
            },
            organization: {
              id: schema.organization.id,
              name: schema.organization.name,
              siteName: schema.organization.siteName,
              theme: schema.organization.theme
            }
          })
          .from(schema.group)
          .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
          .leftJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
          .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
          .where(eq(schema.group.id, course.groupId))
      : Promise.resolve([]);

    // Fetch related data in parallel
    const [groupData, contentItems, attendance] = await Promise.all([
      groupDataPromise,
      getCourseContentItems(finalCourseId, profileId),
      // Get attendance (using courseId, not groupId)
      db.select().from(schema.groupAttendance).where(eq(schema.groupAttendance.courseId, finalCourseId))
    ]);

    // Transform group data
    const groupMembers = groupData
      .filter((row) => row.member)
      .map((row) => ({
        ...row.member!,
        profile: row.profile || null
      }));

    const group =
      groupData.length > 0 && groupData[0].group
        ? {
            ...groupData[0].group,
            members: groupMembers
          }
        : null;

    const org =
      groupData.length > 0 && groupData[0].organization
        ? {
            id: groupData[0].organization.id,
            name: groupData[0].organization.name,
            siteName: groupData[0].organization.siteName ?? null,
            theme: groupData[0].organization.theme ?? null
          }
        : null;

    return {
      ...course,
      group,
      attendance,
      contentItems,
      ...(org !== null && { org })
    };
  } catch (error) {
    console.error('Error in getCourseWithRelations', error);
    throw new Error(`Failed to get course with relations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourse(newCourse: TNewCourse) {
  try {
    return await db.insert(schema.course).values(newCourse).returning();
  } catch (error) {
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourseNewsfeed(newsfeed: TNewCourseNewsfeed) {
  try {
    return await db.insert(schema.courseNewsfeed).values(newsfeed).returning();
  } catch (error) {
    throw new Error(`Failed to create course newsfeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a course by ID
 * @param courseId Course ID
 * @param data Partial course data to update
 * @returns Updated course
 */
export async function updateCourse(courseId: string, data: Partial<TCourse>) {
  try {
    const [updated] = await db
      .update(schema.course)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId))
      .returning();
    return updated;
  } catch (error) {
    throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Soft deletes a course by setting status to 'DELETED'
 * @param courseId Course ID
 * @returns Updated course
 */
export async function deleteCourse(courseId: string) {
  try {
    const [deleted] = await db
      .update(schema.course)
      .set({ status: 'DELETED', updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId))
      .returning();
    return deleted;
  } catch (error) {
    throw new Error(`Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets course progress for a profile
 * Recreates the logic from get_course_progress RPC function
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Course progress with counts of lessons, completed lessons, exercises, and completed exercises
 */
export async function getCourseProgress(
  courseId: string,
  profileId: string
): Promise<{
  lessonsCount: number;
  lessonsCompleted: number;
  exercisesCount: number;
  exercisesCompleted: number;
}> {
  try {
    // Get the groupmember ID for this profile in the course
    const groupMemberResult = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    if (groupMemberResult.length === 0) {
      // User is not a member of this course
      return {
        lessonsCount: 0,
        lessonsCompleted: 0,
        exercisesCount: 0,
        exercisesCompleted: 0
      };
    }

    const groupMemberId = groupMemberResult[0].id;

    // Get all lessons for the course
    const lessons = await db
      .select({ id: schema.lesson.id })
      .from(schema.lesson)
      .where(eq(schema.lesson.courseId, courseId));

    const lessonsCount = lessons.length;

    // Get completed lessons (lesson_completion where is_complete = true and profile_id matches)
    const completedLessons = await db
      .select({ id: schema.lessonCompletion.id })
      .from(schema.lessonCompletion)
      .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.lesson.courseId, courseId),
          eq(schema.lessonCompletion.profileId, profileId),
          eq(schema.lessonCompletion.isComplete, true)
        )
      );

    const lessonsCompleted = completedLessons.length;

    // Get all exercises for the course (legacy lesson_id support)
    const exercises = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)));

    const exercisesCount = exercises.length;

    // Get completed exercises (submissions where submitted_by = groupmember.id)
    const completedExercises = await db
      .select({ id: schema.submission.id })
      .from(schema.submission)
      .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .where(
        and(
          or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
          eq(schema.submission.submittedBy, groupMemberId)
        )
      );

    const exercisesCompleted = completedExercises.length;

    return {
      lessonsCount,
      lessonsCompleted,
      exercisesCount,
      exercisesCompleted
    };
  } catch (error) {
    throw new Error(`Failed to get course progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface GetOrgCoursesOptions {
  /** Organization ID (required) */
  orgId: string;
  /** Profile ID - if provided, filters to courses where user is a member */
  profileId?: string;
}

/**
 * Gets courses for an organization with optional member filtering
 * Returns courses with lesson_count and total_students
 * @param options.orgId Organization ID
 * @param options.profileId Optional profile ID to filter by membership
 * @returns Array of courses with admin-level data
 */
export const getOrgCourses = async ({ orgId, profileId }: GetOrgCoursesOptions): Promise<TAdminCourse[]> => {
  try {
    const baseQuery = db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('lesson_count'),
        studentCount: sql<number>`(SELECT COUNT(*)::bigint
          FROM ${schema.groupmember} as gm
          WHERE gm.group_id = ${schema.course.groupId}
          AND gm.role_id = ${ROLE.STUDENT}
        )`.as('total_students')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId));

    // Build conditions
    const conditions = [eq(schema.group.organizationId, orgId), eq(schema.course.status, 'ACTIVE')];

    // If profileId provided, join groupmember and filter by membership
    const query = profileId
      ? baseQuery
          .innerJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
          .where(and(...conditions, eq(schema.groupmember.profileId, profileId)))
      : baseQuery.where(and(...conditions));

    const result = await query.groupBy(schema.course.id).orderBy(desc(schema.course.createdAt));

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount),
      totalStudents: Number(row.studentCount)
    }));
  } catch (error) {
    throw new Error(`Failed to get org courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface GetEnrolledCoursesOptions {
  /** Organization ID (required) */
  orgId: string;
  /** Student's profile ID (required) */
  profileId: string;
}

/**
 * Gets enrolled courses for a student in an organization
 * Returns courses where the student is enrolled with lesson_count and progress_rate
 * @param options.orgId Organization ID
 * @param options.profileId Student's profile ID
 * @returns Array of courses with student-level data including progress
 */
export const getEnrolledCourses = async ({
  orgId,
  profileId
}: GetEnrolledCoursesOptions): Promise<TStudentCourse[]> => {
  try {
    const result = await db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('lesson_count'),
        progressRate: sql<number>`(
          SELECT COUNT(*)::bigint
          FROM ${schema.lessonCompletion} as lc
          JOIN ${schema.lesson} as l ON l.id = lc.lesson_id
          WHERE l.course_id = ${schema.course.id}
          AND lc.is_complete = true
          AND lc.profile_id = ${sql.raw(`'${profileId}'::uuid`)}
        )`.as('progress_rate')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.groupmember.profileId, profileId)
        )
      )
      .groupBy(schema.course.id)
      .orderBy(desc(schema.course.createdAt));

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount),
      progressRate: Number(row.progressRate)
    }));
  } catch (error) {
    throw new Error(`Failed to get enrolled courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface GetExploreCoursesOptions {
  orgId: string;
  profileId: string;
}

/**
 * Gets recommended courses (published courses user isn't enrolled in) for an organization
 *
 * @param options.orgId Organization ID
 * @param options.profileId Profile ID to exclude enrolled courses
 * @returns Array of courses with explore-level data
 */
export const getExploreCourses = async ({ orgId, profileId }: GetExploreCoursesOptions): Promise<TBaseCourse[]> => {
  try {
    const result = await db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('total_lessons')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          isNull(schema.groupmember.id)
        )
      )
      .groupBy(schema.course.id, schema.group.id)
      .orderBy(desc(schema.course.createdAt));

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount)
    }));
  } catch (error) {
    throw new Error(`Failed to get explore courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets course with organization data (title, org name, org siteName, groupId)
 * @param courseId Course ID
 * @returns Course and organization data or null if not found
 */
export async function getCourseWithOrgData(courseId: string): Promise<{
  courseTitle: string | null;
  orgName: string | null;
  orgSiteName: string | null;
  groupId: string | null;
} | null> {
  try {
    const result = await db
      .select({
        courseTitle: schema.course.title,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        groupId: schema.course.groupId
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    throw new Error(
      `Failed to get course with org data "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets organization name by course ID
 * @param courseId Course ID
 * @returns Organization name or null if not found
 */
export async function getOrganizationByCourseId(courseId: string): Promise<{ orgName: string | null } | null> {
  try {
    const result = await db
      .select({
        orgName: schema.organization.name
      })
      .from(schema.organization)
      .innerJoin(schema.group, eq(schema.group.organizationId, schema.organization.id))
      .innerJoin(schema.course, eq(schema.course.groupId, schema.group.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    throw new Error(
      `Failed to get organization by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates all lessons in a course to use a specific section
 * @param courseId Course ID
 * @param sectionId Section ID
 * @param tx Optional transaction context
 * @returns Number of updated lessons
 */
export async function updateLessonsSectionId(
  courseId: string,
  sectionId: string,
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<number> {
  try {
    const dbInstance = tx || db;
    const updated = await dbInstance
      .update(schema.lesson)
      .set({ sectionId })
      .where(eq(schema.lesson.courseId, courseId))
      .returning();

    return updated.length;
  } catch (error) {
    throw new Error(
      `Failed to update lessons section ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseSectionsByCourseId(courseId: string) {
  try {
    return db.select().from(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
  } catch (error) {
    throw new Error(
      `Failed to get sections by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseSectionById(sectionId: string): Promise<TCourseSection | null> {
  try {
    const [section] = await db
      .select()
      .from(schema.courseSection)
      .where(eq(schema.courseSection.id, sectionId))
      .limit(1);
    return section || null;
  } catch (error) {
    throw new Error(
      `Failed to get course section by ID "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCourseSections(values: TNewCourseSection[], dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.courseSection).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create course sections: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateCourseSection(sectionId: string, data: Partial<TCourseSection>) {
  try {
    const [updated] = await db
      .update(schema.courseSection)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseSection.id, sectionId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update course section "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCourseSection(sectionId: string, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient
      .delete(schema.courseSection)
      .where(eq(schema.courseSection.id, sectionId))
      .returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete course section "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
