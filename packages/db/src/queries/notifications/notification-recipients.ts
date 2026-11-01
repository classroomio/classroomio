import * as schema from '@db/schema';
import { ROLE } from '@cio/utils/constants/roles';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';

import { db } from '@db/drizzle';

/** The subset of `profileIds` that hold an active membership in the organization. */
export async function filterActiveOrganizationMembers(organizationId: string, profileIds: string[]): Promise<string[]> {
  if (profileIds.length === 0) return [];

  try {
    const rows = await db
      .select({ profileId: schema.organizationmember.profileId })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.status, 'ACTIVE'),
          inArray(schema.organizationmember.profileId, profileIds)
        )
      );

    return [...new Set(rows.map((row) => row.profileId).filter((id): id is string => Boolean(id)))];
  } catch (error) {
    console.error('filterActiveOrganizationMembers error:', error);
    throw new Error('Failed to filter organization members');
  }
}

/** The course, its organization, and the profile ids of its enrolled students. */
export async function getCourseStudentAudience(courseId: string): Promise<{
  organizationId: string;
  courseTitle: string | null;
  studentProfileIds: string[];
} | null> {
  try {
    const [course] = await db
      .select({
        organizationId: schema.group.organizationId,
        groupId: schema.course.groupId,
        title: schema.course.title
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    if (!course?.organizationId || !course.groupId) return null;

    const students = await db
      .select({ profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .where(
        and(
          eq(schema.groupmember.groupId, course.groupId),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          isNotNull(schema.groupmember.profileId)
        )
      );

    return {
      organizationId: course.organizationId,
      courseTitle: course.title,
      studentProfileIds: [...new Set(students.map((row) => row.profileId!))]
    };
  } catch (error) {
    console.error('getCourseStudentAudience error:', error);
    throw new Error('Failed to load course audience');
  }
}

export async function getCourseOrganization(courseId: string): Promise<string | null> {
  try {
    const [row] = await db
      .select({ organizationId: schema.group.organizationId })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return row?.organizationId ?? null;
  } catch (error) {
    console.error('getCourseOrganization error:', error);
    throw new Error('Failed to load course organization');
  }
}

/** Profile ids behind group member ids, keyed by group member id. */
export async function getGroupMemberProfileIds(groupMemberIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(groupMemberIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  try {
    const rows = await db
      .select({ id: schema.groupmember.id, profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .where(inArray(schema.groupmember.id, ids));

    return new Map(rows.filter((row) => row.profileId).map((row) => [row.id, row.profileId!]));
  } catch (error) {
    console.error('getGroupMemberProfileIds error:', error);
    throw new Error('Failed to load group member profiles');
  }
}

/** Each profile's preferred language, keyed by profile id; profiles without one are omitted. */
export async function listProfileLocales(profileIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  try {
    const rows = await db
      .select({ id: schema.profile.id, locale: schema.profile.locale })
      .from(schema.profile)
      .where(inArray(schema.profile.id, ids));

    return new Map(rows.filter((row) => row.locale).map((row) => [row.id, row.locale!]));
  } catch (error) {
    console.error('listProfileLocales error:', error);
    throw new Error('Failed to load profile locales');
  }
}
