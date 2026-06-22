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
import { and, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';
import { getCourseContentItems, type CourseContentItemRow } from './content';
import { getUpcomingSessionsForCourseIds, type CourseUpcomingSession } from './session';

/**
 * Base course type - extends TCourse with lessonCount
 * Used by public endpoint for landing pages
 */
export interface TBaseCourse extends TCourse {
  lessonCount: number;
  exerciseCount: number;
}

/**
 * Admin/Tutor course type - extends TBaseCourse with totalStudents
 * Used for admin and tutor dashboard views
 */
export interface TAdminCourse extends TBaseCourse {
  totalStudents: number;
}

/**
 * Student course type - extends TBaseCourse with progress fields
 * Used for student dashboard and enrolled courses views
 * progressRate = lessons completed, exercisesCompleted = exercises submitted
 */
export interface TStudentCourse extends TBaseCourse {
  progressRate: number;
  exercisesCompleted: number;
  certificateEarnedAt: string | null;
  complianceStatus: string | null;
  complianceCycleNumber: number | null;
  complianceDueDate: string | null;
  complianceValidUntil: string | null;
  upcomingSession: CourseUpcomingSession | null;
}

/**
 * Gets published courses by organization siteName
 * @param siteName Organization site name
 * @returns Array of published courses with lesson counts
 */
export const getPublishedCoursesBySiteName = async (
  siteName: string,
  courseIds?: string[],
  limit?: number,
  offset?: number
): Promise<TBaseCourse[]> => {
  try {
    if (courseIds && courseIds.length === 0) {
      return [];
    }

    const conditions = [
      eq(schema.organization.siteName, siteName),
      eq(schema.course.status, 'ACTIVE'),
      eq(schema.course.isPublished, true)
    ];

    if (courseIds && courseIds.length > 0) {
      conditions.push(inArray(schema.course.id, courseIds));
    }

    const exerciseCountSql = sql<number>`(
      SELECT COUNT(*)::bigint
      FROM ${schema.exercise} as ex
      LEFT JOIN ${schema.lesson} as el ON el.id = ex.lesson_id
      WHERE ${or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id))}
    )`.as('exercise_count');

    const result = limit
      ? await db
          .select({
            course: schema.course,
            lessonCount: sql<number>`COUNT(${schema.lesson.id})`.as('lesson_count'),
            exerciseCount: exerciseCountSql
          })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
          .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
          .where(and(...conditions))
          .groupBy(schema.course.id)
          .orderBy(desc(schema.course.createdAt))
          .limit(limit)
          .offset(offset ?? 0)
      : await db
          .select({
            course: schema.course,
            lessonCount: sql<number>`COUNT(${schema.lesson.id})`.as('lesson_count'),
            exerciseCount: exerciseCountSql
          })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
          .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
          .where(and(...conditions))
          .groupBy(schema.course.id)
          .orderBy(desc(schema.course.createdAt));

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount),
      exerciseCount: Number(row.exerciseCount)
    }));
  } catch (error) {
    console.error('getCoursesBySiteName error:', error);
    throw new Error(
      `Failed to get courses by site name "${siteName}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const countPublishedCoursesBySiteName = async (siteName: string, courseIds?: string[]): Promise<number> => {
  try {
    if (courseIds && courseIds.length === 0) {
      return 0;
    }

    const conditions = [
      eq(schema.organization.siteName, siteName),
      eq(schema.course.status, 'ACTIVE'),
      eq(schema.course.isPublished, true)
    ];

    if (courseIds && courseIds.length > 0) {
      conditions.push(inArray(schema.course.id, courseIds));
    }

    const [result] = await db
      .select({
        total: count(schema.course.id)
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(and(...conditions));

    return Number(result?.total ?? 0);
  } catch (error) {
    console.error('countPublishedCoursesBySiteName error:', error);
    throw new Error(
      `Failed to count courses by site name "${siteName}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('getCoursesById error:', error);
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
    .where(eq(schema.organization.siteName, siteName));

  return result.map((row) => ({
    ...row.course
  }));
};
export async function getCourseById(courseId: string) {
  try {
    return await db.select().from(schema.course).where(eq(schema.course.id, courseId)).limit(1);
  } catch (error) {
    console.error('getCourseById error:', error);
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
    customDomain: string | null;
    isCustomDomainVerified: boolean | null;
    theme: string | null;
    avatarUrl: string | null;
    settings: (typeof schema.organization.$inferSelect)['settings'];
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
        customDomain: string | null;
        isCustomDomainVerified: boolean | null;
        theme: string | null;
        avatarUrl: string | null;
        settings: (typeof schema.organization.$inferSelect)['settings'];
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
              customDomain: schema.organization.customDomain,
              isCustomDomainVerified: schema.organization.isCustomDomainVerified,
              theme: schema.organization.theme,
              avatarUrl: schema.organization.avatarUrl,
              settings: schema.organization.settings
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
            customDomain: groupData[0].organization.customDomain ?? null,
            isCustomDomainVerified: groupData[0].organization.isCustomDomainVerified ?? null,
            theme: groupData[0].organization.theme ?? null,
            avatarUrl: groupData[0].organization.avatarUrl ?? null,
            settings: groupData[0].organization.settings ?? null
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
    console.error('getCourseWithRelations error:', error);
    throw new Error(`Failed to get course with relations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourse(newCourse: TNewCourse, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient.insert(schema.course).values(newCourse).returning();
  } catch (error) {
    console.error('createCourse error:', error);
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourseNewsfeed(newsfeed: TNewCourseNewsfeed, dbClient: DbOrTxClient = db) {
  try {
    return await dbClient.insert(schema.courseNewsfeed).values(newsfeed).returning();
  } catch (error) {
    console.error('createCourseNewsfeed error:', error);
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
    console.error('updateCourse error:', error);
    throw new Error(`Failed to update course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Bumps updatedAt on a course without changing any other fields.
 * Call this whenever course content (lessons, exercises) changes.
 */
export async function touchCourseUpdatedAt(courseId: string) {
  try {
    await db.update(schema.course).set({ updatedAt: new Date().toISOString() }).where(eq(schema.course.id, courseId));
  } catch (error) {
    console.error('touchCourseUpdatedAt error:', error);
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
    console.error('deleteCourse error:', error);
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
  groupMemberId: string | null;
  roleId: number | null;
  certificateEarnedAt: string | null;
  certificationEmailSentAt: string | null;
}> {
  try {
    // Get the groupmember ID for this profile in the course
    const groupMemberResult = await db
      .select({
        id: schema.groupmember.id,
        roleId: schema.groupmember.roleId,
        certificateEarnedAt: schema.groupmember.certificateEarnedAt,
        certificationEmailSentAt: schema.groupmember.certificationEmailSentAt
      })
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
        exercisesCompleted: 0,
        groupMemberId: null,
        roleId: null,
        certificateEarnedAt: null,
        certificationEmailSentAt: null
      };
    }

    const groupMemberId = groupMemberResult[0].id;
    const roleId = groupMemberResult[0].roleId;
    const certificateEarnedAt = groupMemberResult[0].certificateEarnedAt ?? null;
    const certificationEmailSentAt = groupMemberResult[0].certificationEmailSentAt ?? null;

    const [lessons, completedLessons, exercises, [completedRow]] = await Promise.all([
      db.select({ id: schema.lesson.id }).from(schema.lesson).where(eq(schema.lesson.courseId, courseId)),

      db
        .select({ id: schema.lessonCompletion.id })
        .from(schema.lessonCompletion)
        .innerJoin(schema.lesson, eq(schema.lessonCompletion.lessonId, schema.lesson.id))
        .where(
          and(
            eq(schema.lesson.courseId, courseId),
            eq(schema.lessonCompletion.profileId, profileId),
            eq(schema.lessonCompletion.isComplete, true)
          )
        ),

      db
        .select({ id: schema.exercise.id })
        .from(schema.exercise)
        .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
        .where(or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId))),

      db
        .select({
          exercisesCompleted: sql<number>`count(distinct ${schema.exercise.id})::int`
        })
        .from(schema.submission)
        .innerJoin(schema.exercise, eq(schema.submission.exerciseId, schema.exercise.id))
        .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
        .where(
          and(
            or(eq(schema.exercise.courseId, courseId), eq(schema.lesson.courseId, courseId)),
            eq(schema.submission.submittedBy, groupMemberId)
          )
        )
    ]);

    return {
      lessonsCount: lessons.length,
      lessonsCompleted: completedLessons.length,
      exercisesCount: exercises.length,
      exercisesCompleted: completedRow?.exercisesCompleted ?? 0,
      groupMemberId,
      roleId,
      certificateEarnedAt,
      certificationEmailSentAt
    };
  } catch (error) {
    console.error('getCourseProgress error:', error);
    throw new Error(`Failed to get course progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Course + org fields needed for certification email and threshold rules */
export type TCourseCertificationRow = {
  type: string | null;
  compliance: {
    retakeIntervalMonths: number;
    gracePeriodDays?: number;
    reminderDaysBefore?: number[];
    isMandatory?: boolean;
    framework?: 'HIPAA' | 'OSHA' | 'SOX' | 'GDPR' | 'PCI_DSS' | 'FERPA' | 'ISO' | 'CUSTOM' | null;
    maxRetakeAttempts?: number | null;
    passingScore?: number;
  } | null;
  certificate: {
    isDownloadable?: boolean;
    theme?: string;
    deadline?: string | null;
    threshold?: number;
    requiredExerciseId?: string | null;
    exerciseMinScorePercent?: number | null;
    emailMessage?: string | null;
  } | null;
  title: string;
  orgSiteName: string | null;
  orgCustomDomain: string | null;
  orgIsCustomDomainVerified: boolean | null;
  orgName: string;
  orgAvatarUrl: string | null;
  orgTheme: string | null;
};

export async function getCourseCertificationRow(courseId: string): Promise<TCourseCertificationRow | null> {
  try {
    const [row] = await db
      .select({
        type: schema.course.type,
        compliance: schema.course.compliance,
        certificate: schema.course.certificate,
        title: schema.course.title,
        orgSiteName: schema.organization.siteName,
        orgCustomDomain: schema.organization.customDomain,
        orgIsCustomDomainVerified: schema.organization.isCustomDomainVerified,
        orgName: schema.organization.name,
        orgAvatarUrl: schema.organization.avatarUrl,
        orgTheme: schema.organization.theme
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCourseCertificationRow error:', error);
    throw new Error(
      `Failed to get course certification row: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

interface GetOrgCoursesOptions {
  /** Organization ID (required) */
  orgId: string;
  /** Profile ID - if provided, filters to courses where user is a member */
  profileId?: string;
  /** Optional course IDs filter */
  courseIds?: string[];
  /** Optional search query against the course title */
  search?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Page size */
  limit?: number;
}

export interface GetOrgCoursesResult {
  items: TAdminCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Gets courses for an organization with optional member filtering
 * Returns courses with lesson_count and total_students
 * @param options.orgId Organization ID
 * @param options.profileId Optional profile ID to filter by membership
 * @returns Array of courses with admin-level data
 */
export const getOrgCourses = async ({
  orgId,
  profileId,
  courseIds,
  search,
  page = 1,
  limit = 20
}: GetOrgCoursesOptions): Promise<GetOrgCoursesResult> => {
  try {
    if (courseIds && courseIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }

    const conditions = [eq(schema.group.organizationId, orgId), eq(schema.course.status, 'ACTIVE')];

    if (courseIds && courseIds.length > 0) {
      conditions.push(inArray(schema.course.id, courseIds));
    }

    if (search?.trim()) {
      conditions.push(ilike(schema.course.title, `%${search.trim()}%`));
    }

    const totalQuery = profileId
      ? db
          .select({ count: count(schema.course.id) })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .innerJoin(
            schema.groupmember,
            and(eq(schema.groupmember.groupId, schema.group.id), eq(schema.groupmember.profileId, profileId))
          )
          .where(and(...conditions))
      : db
          .select({ count: count(schema.course.id) })
          .from(schema.course)
          .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
          .where(and(...conditions));

    const [countRow] = await totalQuery;
    const total = Number(countRow?.count ?? 0);

    const baseQuery = db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('lesson_count'),
        studentCount: sql<number>`(SELECT COUNT(*)::bigint
          FROM ${schema.groupmember} as gm
          WHERE ${eq(sql`gm.group_id`, schema.course.groupId)}
          AND gm.role_id = ${ROLE.STUDENT}
        )`.as('total_students'),
        exerciseCount: sql<number>`(
          SELECT COUNT(*)::bigint
          FROM ${schema.exercise} as ex
          LEFT JOIN ${schema.lesson} as el ON el.id = ex.lesson_id
          WHERE ${or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id))}
        )`.as('exercise_count')
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId));

    const itemsQuery = profileId
      ? baseQuery
          .innerJoin(
            schema.groupmember,
            and(eq(schema.groupmember.groupId, schema.group.id), eq(schema.groupmember.profileId, profileId))
          )
          .where(and(...conditions))
      : baseQuery.where(and(...conditions));

    const result = await itemsQuery
      .groupBy(schema.course.id)
      .orderBy(desc(schema.course.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      items: result.map((row) => ({
        ...row.course,
        lessonCount: Number(row.lessonCount),
        totalStudents: Number(row.studentCount),
        exerciseCount: Number(row.exerciseCount)
      })),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('getOrgCourses error:', error);
    throw new Error(`Failed to get org courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export interface TSearchOrgCourse {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  updatedAt: string | null;
}

export async function searchOrgCourses(orgId: string, search: string, limit: number): Promise<TSearchOrgCourse[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        slug: schema.course.slug,
        description: schema.course.description,
        updatedAt: schema.course.updatedAt
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          or(ilike(schema.course.title, searchValue), ilike(schema.course.description, searchValue))
        )
      )
      .orderBy(desc(schema.course.updatedAt))
      .limit(limit);
  } catch (error) {
    console.error('searchOrgCourses error:', error);
    throw new Error(`Failed to search org courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchLmsCourses(
  orgId: string,
  profileId: string,
  search: string,
  limit: number
): Promise<TSearchOrgCourse[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    const result = await db
      .select({
        id: schema.course.id,
        title: schema.course.title,
        slug: schema.course.slug,
        description: schema.course.description,
        updatedAt: schema.course.updatedAt
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.group.id, schema.groupmember.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .leftJoin(schema.programCourse, eq(schema.course.id, schema.programCourse.courseId))
      .leftJoin(
        schema.program,
        and(
          eq(schema.programCourse.programId, schema.program.id),
          eq(schema.program.organizationId, orgId),
          eq(schema.program.status, 'ACTIVE')
        )
      )
      .leftJoin(
        schema.programMember,
        and(eq(schema.program.id, schema.programMember.programId), eq(schema.programMember.profileId, profileId))
      )
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          or(isNotNull(schema.groupmember.id), isNotNull(schema.programMember.id)),
          or(ilike(schema.course.title, searchValue), ilike(schema.course.description, searchValue))
        )
      )
      .groupBy(schema.course.id)
      .orderBy(desc(schema.course.updatedAt))
      .limit(limit);

    return result;
  } catch (error) {
    console.error('searchLmsCourses error:', error);
    throw new Error(`Failed to search LMS courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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
    const latestComplianceCycles = db
      .select({
        courseId: schema.courseCompletionRecord.courseId,
        profileId: schema.courseCompletionRecord.profileId,
        latestCycleNumber: sql<number>`MAX(${schema.courseCompletionRecord.cycleNumber})`.as('latest_cycle_number')
      })
      .from(schema.courseCompletionRecord)
      .where(eq(schema.courseCompletionRecord.profileId, profileId))
      .groupBy(schema.courseCompletionRecord.courseId, schema.courseCompletionRecord.profileId)
      .as('latest_enrolled_course_compliance_cycles');

    // Single query covering both access paths:
    //   1. Direct enrollment: student has a groupmember row for the course's group
    //   2. Program membership: student is a program_member of a program that contains the course
    //
    // Profile filters are pushed into each LEFT JOIN's ON clause so the database
    // can filter early. The WHERE then requires at least one path to have matched.
    // GROUP BY course.id deduplicates courses accessible via both paths simultaneously.
    // exercisesCompleted uses a profileId-based subquery so it doesn't depend on
    // the outer groupmember join (which may be NULL for program-only access).
    const result = await db
      .select({
        course: schema.course,
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('lesson_count'),
        progressRate: sql<number>`(
          SELECT COUNT(*)::bigint
          FROM ${schema.lessonCompletion} as lc
          JOIN ${schema.lesson} as l ON l.id = lc.lesson_id
          WHERE ${eq(sql`l.course_id`, schema.course.id)}
          AND lc.is_complete = true
          AND lc.profile_id = ${sql.raw(`'${profileId}'::uuid`)}
        )`.as('progress_rate'),
        exerciseCount: sql<number>`(
          SELECT COUNT(*)::bigint
          FROM ${schema.exercise} as ex
          LEFT JOIN ${schema.lesson} as el ON el.id = ex.lesson_id
          WHERE ${or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id))}
        )`.as('exercise_count'),
        exercisesCompleted: sql<number>`(
          SELECT COUNT(DISTINCT s.exercise_id)::bigint
          FROM ${schema.submission} as s
          JOIN ${schema.exercise} as ex ON ex.id = s.exercise_id
          LEFT JOIN ${schema.lesson} as el ON el.id = ex.lesson_id
          JOIN ${schema.groupmember} as gm ON gm.id = s.submitted_by
          WHERE ${and(
            or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id)),
            sql`gm.profile_id = ${sql.raw(`'${profileId}'::uuid`)}`
          )}
        )`.as('exercises_completed'),
        certificateEarnedAt: schema.groupmember.certificateEarnedAt,
        complianceStatus: schema.courseCompletionRecord.status,
        complianceCycleNumber: schema.courseCompletionRecord.cycleNumber,
        complianceDueDate: schema.courseCompletionRecord.dueDate,
        complianceValidUntil: schema.courseCompletionRecord.validUntil
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.group.id, schema.groupmember.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .leftJoin(
        latestComplianceCycles,
        and(eq(latestComplianceCycles.courseId, schema.course.id), eq(latestComplianceCycles.profileId, profileId))
      )
      .leftJoin(
        schema.courseCompletionRecord,
        and(
          eq(schema.courseCompletionRecord.courseId, schema.course.id),
          eq(schema.courseCompletionRecord.profileId, profileId),
          eq(schema.courseCompletionRecord.cycleNumber, latestComplianceCycles.latestCycleNumber)
        )
      )
      .leftJoin(schema.programCourse, eq(schema.course.id, schema.programCourse.courseId))
      .leftJoin(
        schema.program,
        and(
          eq(schema.programCourse.programId, schema.program.id),
          eq(schema.program.organizationId, orgId),
          eq(schema.program.status, 'ACTIVE')
        )
      )
      .leftJoin(
        schema.programMember,
        and(eq(schema.program.id, schema.programMember.programId), eq(schema.programMember.profileId, profileId))
      )
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(
          eq(schema.group.organizationId, orgId),
          eq(schema.course.status, 'ACTIVE'),
          or(isNotNull(schema.groupmember.id), isNotNull(schema.programMember.id))
        )
      )
      .groupBy(schema.course.id, schema.groupmember.id, schema.courseCompletionRecord.id)
      .orderBy(desc(schema.course.createdAt));

    const liveCourseIds = result.filter((row) => row.course.type === 'LIVE_CLASS').map((row) => row.course.id);
    const upcomingByCourse = await getUpcomingSessionsForCourseIds(liveCourseIds);

    return result.map((row) => ({
      ...row.course,
      lessonCount: Number(row.lessonCount),
      progressRate: Number(row.progressRate),
      exerciseCount: Number(row.exerciseCount),
      exercisesCompleted: Number(row.exercisesCompleted),
      certificateEarnedAt: row.certificateEarnedAt ?? null,
      complianceStatus: row.complianceStatus ?? null,
      complianceCycleNumber: row.complianceCycleNumber ?? null,
      complianceDueDate: row.complianceDueDate ?? null,
      complianceValidUntil: row.complianceValidUntil ?? null,
      upcomingSession: upcomingByCourse.get(row.course.id) ?? null
    }));
  } catch (error) {
    console.error('getEnrolledCourses error:', error);
    throw new Error(`Failed to get enrolled courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

interface GetExploreCoursesOptions {
  orgId: string;
  profileId: string;
  limit?: number;
  page?: number;
}

export interface GetExploreCoursesResult {
  data: TBaseCourse[];
  total: number;
}

/**
 * Gets recommended courses (published courses user isn't enrolled in) for an organization
 *
 * @param options.orgId Organization ID
 * @param options.profileId Profile ID to exclude enrolled courses
 * @param options.limit Optional max number of courses to return
 * @param options.page Optional page number (1-based, used with limit)
 * @returns Courses with explore-level data and total count
 */
export const getExploreCourses = async ({
  orgId,
  profileId,
  limit,
  page = 1
}: GetExploreCoursesOptions): Promise<GetExploreCoursesResult> => {
  try {
    const whereCondition = and(
      eq(schema.group.organizationId, orgId),
      eq(schema.course.status, 'ACTIVE'),
      eq(schema.course.isPublished, true),
      isNull(schema.groupmember.id),
      or(
        sql`${schema.course.metadata}->>'allowNewStudent' IS NULL`,
        sql`${schema.course.metadata}->>'allowNewStudent' != 'false'`
      )
    );

    const courseSelect = {
      course: schema.course,
      lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('total_lessons'),
      exerciseCount: sql<number>`(
        SELECT COUNT(*)::bigint
        FROM ${schema.exercise} as ex
        LEFT JOIN ${schema.lesson} as el ON el.id = ex.lesson_id
        WHERE ${or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id))}
      )`.as('exercise_count')
    };

    const baseSelect = db
      .select(courseSelect)
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .where(whereCondition)
      .groupBy(schema.course.id, schema.group.id)
      .orderBy(desc(schema.course.createdAt));

    const countSelect = db
      .select({ total: count(schema.course.id) })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, profileId))
      )
      .where(whereCondition);

    const [countRows, rows] = await Promise.all([
      countSelect,
      limit ? baseSelect.limit(limit).offset((page - 1) * limit) : baseSelect
    ]);

    return {
      data: rows.map((row) => ({
        ...row.course,
        lessonCount: Number(row.lessonCount),
        exerciseCount: Number(row.exerciseCount)
      })),
      total: Number(countRows[0]?.total ?? 0)
    };
  } catch (error) {
    console.error('getExploreCourses error:', error);
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
  orgCustomDomain: string | null;
  orgIsCustomDomainVerified: boolean | null;
  orgAvatarUrl: string | null;
  orgTheme: string | null;
  groupId: string | null;
  welcomeEmailMessage: string | null;
} | null> {
  try {
    const result = await db
      .select({
        courseTitle: schema.course.title,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        orgCustomDomain: schema.organization.customDomain,
        orgIsCustomDomainVerified: schema.organization.isCustomDomainVerified,
        orgAvatarUrl: schema.organization.avatarUrl,
        orgTheme: schema.organization.theme,
        groupId: schema.course.groupId,
        metadata: schema.course.metadata
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { metadata, ...rest } = result[0];

    return { ...rest, welcomeEmailMessage: metadata?.welcomeEmailMessage ?? null };
  } catch (error) {
    console.error('getCourseWithOrgData error:', error);
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
    console.error('getOrganizationByCourseId error:', error);
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
    console.error('updateLessonsSectionId error:', error);
    throw new Error(
      `Failed to update lessons section ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateUngroupedLessonsSectionId(
  courseId: string,
  sectionId: string,
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<number> {
  try {
    const dbInstance = tx || db;
    const updated = await dbInstance
      .update(schema.lesson)
      .set({ sectionId })
      .where(and(eq(schema.lesson.courseId, courseId), isNull(schema.lesson.sectionId)))
      .returning();

    return updated.length;
  } catch (error) {
    console.error('updateUngroupedLessonsSectionId error:', error);
    throw new Error(
      `Failed to update ungrouped lessons section ID "${courseId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function getCourseSectionsByCourseId(courseId: string) {
  try {
    return db.select().from(schema.courseSection).where(eq(schema.courseSection.courseId, courseId));
  } catch (error) {
    console.error('getCourseSectionsByCourseId error:', error);
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
    console.error('getCourseSectionById error:', error);
    throw new Error(
      `Failed to get course section by ID "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCourseSections(values: TNewCourseSection[], dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.courseSection).values(values).returning();
  } catch (error) {
    console.error('createCourseSections error:', error);
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
    console.error('updateCourseSection error:', error);
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
    console.error('deleteCourseSection error:', error);
    throw new Error(
      `Failed to delete course section "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets group IDs for multiple courses at once
 * @param courseIds Array of course IDs
 * @returns Array of { courseId, groupId } mappings
 */
export async function getCourseGroupIds(courseIds: string[]) {
  try {
    if (courseIds.length === 0) return [];

    return db
      .select({ courseId: schema.course.id, groupId: schema.course.groupId })
      .from(schema.course)
      .where(inArray(schema.course.id, courseIds));
  } catch (error) {
    console.error('getCourseGroupIds error:', error);
    throw new Error(`Failed to get course group IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets course group mappings for an organization, including course title
 * @param orgId Organization ID
 * @param courseIds Array of course IDs to filter
 * @returns Array of { courseId, courseTitle, groupId }
 */
export async function getOrgCourseGroups(orgId: string, courseIds: string[]) {
  try {
    if (courseIds.length === 0) return [];

    const rows = await db
      .select({
        courseId: schema.course.id,
        courseTitle: schema.course.title,
        groupId: schema.course.groupId,
        metadata: schema.course.metadata
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .where(and(eq(schema.group.organizationId, orgId), inArray(schema.course.id, courseIds)));

    return rows.map(({ metadata, ...rest }) => ({
      ...rest,
      welcomeEmailMessage: metadata?.welcomeEmailMessage ?? null
    }));
  } catch (error) {
    console.error('getOrgCourseGroups error:', error);
    throw new Error(`Failed to get org course groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** True when any course row exists with this slug. */
export async function isCourseSlugTaken(slug: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: schema.course.id })
      .from(schema.course)
      .where(eq(schema.course.slug, slug))
      .limit(1);

    return rows.length > 0;
  } catch (error) {
    console.error('isCourseSlugTaken error:', error);
    throw new Error(`Failed to check course slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Course `type` only; `undefined` when the course does not exist. */
export async function getCourseTypeById(courseId: string): Promise<string | undefined> {
  try {
    const [row] = await db
      .select({ type: schema.course.type })
      .from(schema.course)
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row?.type ?? undefined;
  } catch (error) {
    console.error('getCourseTypeById error:', error);
    throw new Error(`Failed to get course type: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Updates slug + updatedAt; returns the new slug row or null if the course was missing. */
export async function updateCourseSlug(courseId: string, slug: string): Promise<{ slug: string | null } | null> {
  try {
    const [updated] = await db
      .update(schema.course)
      .set({ slug, updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId))
      .returning({ slug: schema.course.slug });

    return updated ?? null;
  } catch (error) {
    console.error('updateCourseSlug error:', error);
    throw new Error(`Failed to update course slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
