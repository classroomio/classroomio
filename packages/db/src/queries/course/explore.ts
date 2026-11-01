import * as schema from '@db/schema';

import { and, eq, or, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';
import { resolveCourseBannerImage } from '@cio/utils/functions';

export type ExploreCourseDetailRow = {
  course: typeof schema.course.$inferSelect;
  organization: {
    id: string;
    name: string;
    siteName: string | null;
    customDomain: string | null;
    isCustomDomainVerified: boolean | null;
  };
  lessonCount: number;
  exerciseCount: number;
  groupMemberId: string | null;
};

/**
 * A published, active, non-template course of the organization with its lesson and exercise counts and the
 * profile's group membership, or null when no such course exists.
 */
export async function getExploreCourseDetail(params: {
  orgId: string;
  profileId: string;
  courseId: string;
}): Promise<ExploreCourseDetailRow | null> {
  try {
    const [row] = await db
      .select({
        course: schema.course,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName,
          customDomain: schema.organization.customDomain,
          isCustomDomainVerified: schema.organization.isCustomDomainVerified
        },
        lessonCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${schema.lesson} AS l WHERE l.course_id = ${schema.course.id}
        )`,
        exerciseCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${schema.exercise} AS ex
          LEFT JOIN ${schema.lesson} AS el ON el.id = ex.lesson_id
          WHERE ${or(eq(sql`ex.course_id`, schema.course.id), eq(sql`el.course_id`, schema.course.id))}
        )`,
        groupMemberId: schema.groupmember.id
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.organization.id, schema.group.organizationId))
      .leftJoin(
        schema.groupmember,
        and(eq(schema.groupmember.groupId, schema.course.groupId), eq(schema.groupmember.profileId, params.profileId))
      )
      .where(
        and(
          eq(schema.course.id, params.courseId),
          eq(schema.group.organizationId, params.orgId),
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.course.isTemplate, false)
        )
      )
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      course: { ...row.course, bannerImage: resolveCourseBannerImage(row.course) },
      lessonCount: Number(row.lessonCount),
      exerciseCount: Number(row.exerciseCount),
      groupMemberId: row.groupMemberId ?? null
    };
  } catch (error) {
    console.error('getExploreCourseDetail error:', error);
    throw new Error('Failed to load explore course');
  }
}
