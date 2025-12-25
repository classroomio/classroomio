import * as schema from '@db/schema';

import { TCourse, TNewCourse } from '@db/types';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

/**
 * Gets courses by organization siteName
 * @param siteName Organization site name
 * @returns Array of courses with lesson counts and organization info
 */
export const getPublishedCoursesBySiteName = async (siteName: string): Promise<TCourse[]> => {
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
        and(
          eq(schema.organization.siteName, siteName),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true)
        )
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
      course: schema.course,
      organization: {
        id: schema.organization.id,
        name: schema.organization.name,
        siteName: schema.organization.siteName,
        avatarUrl: schema.organization.avatarUrl
      }
    })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
    .where(eq(schema.organization.siteName, siteName))
    .limit(1);

  return result.map((row) => ({
    ...row.course,
    group: {
      organization: row.organization
    }
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

export async function createCourse(newCourse: TNewCourse) {
  try {
    return await db.insert(schema.course).values(newCourse).returning();
  } catch (error) {
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets all courses by organization siteName (including unpublished courses)
 * Used for admin access to see all courses regardless of publication status
 * @param siteName Organization site name
 * @returns Array of courses with lesson counts and organization info
 */
export const getAllCoursesBySiteName = async (siteName: string): Promise<TCourse[]> => {
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
        and(
          eq(schema.organization.siteName, siteName),
          eq(schema.course.status, 'ACTIVE')
          // Note: No isPublished filter - returns all active courses
        )
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
      `Failed to get all courses by site name "${siteName}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Gets courses by organization orgId where user is a groupmember
 * @param orgId Organization orgId
 * @param profileId Profile ID of the user
 * @returns Array of courses with lesson counts, progress, and membership info
 */
export const getCoursesByOrgIdAndProfileId = async (orgId: string, profileId: string): Promise<TCourse[]> => {
  try {
    // Get all courses for the org where user is a groupmember
    const result = await db
      .select({
        course: schema.course,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          avatarUrl: schema.organization.avatarUrl
        },
        lessonCount: sql<number>`COUNT(DISTINCT ${schema.lesson.id})`.as('lesson_count'),
        groupmember: {
          profileId: schema.groupmember.profileId,
          roleId: schema.groupmember.roleId
        }
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .innerJoin(schema.groupmember, eq(schema.group.id, schema.groupmember.groupId))
      .leftJoin(schema.lesson, eq(schema.course.id, schema.lesson.courseId))
      .where(
        and(
          eq(schema.organization.id, orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.groupmember.profileId, profileId)
        )
      )
      .groupBy(
        schema.course.id,
        schema.organization.id,
        schema.organization.name,
        schema.organization.siteName,
        schema.organization.avatarUrl,
        schema.groupmember.profileId,
        schema.groupmember.roleId
      );

    return result.map((row) => ({
      ...row.course,
      lessons: [{ count: Number(row.lessonCount) }],
      group: {
        organization: row.organization
      },
      member_profile_id: row.groupmember.profileId,
      role_id: Number(row.groupmember.roleId)
    }));
  } catch (error) {
    throw new Error(
      `Failed to get courses by org ID and profile ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
