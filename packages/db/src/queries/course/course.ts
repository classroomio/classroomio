import * as schema from '@db/schema';

import { and, eq, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';
import { TNewCourse } from '@db/types';

/**
 * Gets courses by organization siteName
 * @param siteName Organization site name
 * @returns Array of courses with lesson counts and organization info
 */
export const getCoursesBySiteName = async (siteName: string) => {
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
    throw new Error(`Failed to get courses by site name "${siteName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export async function getCourseById(courseId: string) {
  try {
    return await db.select().from(schema.course).where(eq(schema.course.id, courseId)).limit(1);
  } catch (error) {
    throw new Error(`Failed to get course by ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createCourse(newCourse: TNewCourse) {
  try {
    return await db.insert(schema.course).values(newCourse).returning();
  } catch (error) {
    throw new Error(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
