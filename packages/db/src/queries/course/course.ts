import * as schema from '@db/schema';

import { TCourse, TNewCourse } from '@db/types';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

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

// TODO: Remove this function, use the service that determines the role of the user and returns the courses accordingly. i
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
    .innerJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
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
 * Gets a course by ID or slug with all related data (group, members, lessons, sections, attendance)
 * @param courseId Course ID (optional if slug provided)
 * @param slug Course slug (optional if courseId provided)
 * @returns Course with all related data or null if not found
 */
export async function getCourseWithRelations(courseId?: string, slug?: string) {
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

    // Only fetch group data if groupId exists
    const groupPromises: Promise<any>[] = [];
    if (course.groupId) {
      groupPromises.push(
        db
          .select({
            group: schema.group,
            member: schema.groupmember,
            profile: {
              id: schema.profile.id,
              fullname: schema.profile.fullname,
              username: schema.profile.username,
              avatarUrl: schema.profile.avatarUrl,
              email: schema.profile.email
            }
          })
          .from(schema.group)
          .leftJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
          .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
          .where(eq(schema.group.id, course.groupId))
      );
    } else {
      groupPromises.push(Promise.resolve([]));
    }

    // Fetch related data in parallel
    const [groupData, lessonSections, lessons, attendance] = await Promise.all([
      ...groupPromises,
      // Get lesson sections
      db.select().from(schema.lessonSection).where(eq(schema.lessonSection.courseId, finalCourseId)),
      // Get lessons with teacher profile and completion counts
      db
        .select({
          lesson: schema.lesson,
          teacher: schema.profile,
          exerciseCount: sql<number>`COUNT(DISTINCT ${schema.exercise.id})`.as('exercise_count'),
          commentCount: sql<number>`COUNT(DISTINCT ${schema.lessonComment.id})`.as('comment_count')
        })
        .from(schema.lesson)
        .leftJoin(schema.profile, eq(schema.lesson.teacherId, schema.profile.id))
        .leftJoin(schema.exercise, eq(schema.lesson.id, schema.exercise.lessonId))
        .leftJoin(schema.lessonComment, eq(schema.lesson.id, schema.lessonComment.lessonId))
        .where(eq(schema.lesson.courseId, finalCourseId))
        .groupBy(schema.lesson.id, schema.profile.id),
      // Get attendance (using courseId, not groupId)
      db.select().from(schema.groupAttendance).where(eq(schema.groupAttendance.courseId, finalCourseId))
    ]);

    // Transform group data
    const groupMembers = groupData
      .filter((row: { member: any }) => row.member)
      .map((row: { member: any; profile: any }) => ({
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

    // Transform lessons
    const transformedLessons = lessons.map(
      (row: { lesson: any; teacher: any; exerciseCount: any; commentCount: any }) => ({
        ...row.lesson,
        profile: row.teacher || null,
        totalExercises: Number(row.exerciseCount) || 0,
        totalComments: Number(row.commentCount) || 0
      })
    );

    // Transform attendance - result is already the groupAttendance records
    const transformedAttendance = attendance;

    return {
      ...course,
      group,
      lesson_section: lessonSections,
      lessons: transformedLessons,
      attendance: transformedAttendance
    };
  } catch (error) {
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
