import * as schema from '@db/schema';

import { TNewGroup, TNewGroupmember } from '@db/types';
import { and, eq, isNotNull, or } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

export async function createGroup(values: TNewGroup) {
  try {
    return db.insert(schema.group).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addGroupMember(values: TNewGroupmember) {
  try {
    return db.insert(schema.groupmember).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to add group member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if a user is a member of a course's group (any role)
 * @param courseId Course ID
 * @param profileId Profile ID to check
 */
export const isUserCourseMember = async (
  courseId: string,
  profileId: string
): Promise<{ isMember: boolean; organizationId: string | null }> => {
  const result = await db
    .select({ organizationId: schema.group.organizationId, roleId: schema.groupmember.roleId })
    .from(schema.groupmember)
    .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
    .limit(1);

  return {
    isMember: result.length > 0,
    organizationId: result[0].organizationId
  };
};

/**
 * Checks if a user is either:
 * - a member of the course's group (any role), OR
 * - an ADMIN of the organization that owns the course's group.
 *
 * This is designed for middleware use to avoid doing multiple DB queries.
 */
export const isUserCourseMemberOrOrgAdmin = async (courseId: string, profileId: string): Promise<boolean> => {
  console.log('courseId', courseId);
  console.log('profileId', profileId);
  const result = await db
    .select({
      groupMemberId: schema.groupmember.id,
      orgMemberId: schema.organizationmember.id
    })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(
      schema.groupmember,
      and(eq(schema.groupmember.groupId, schema.group.id), eq(schema.groupmember.profileId, profileId))
    )
    .leftJoin(
      schema.organizationmember,
      and(
        eq(schema.organizationmember.organizationId, schema.group.organizationId),
        eq(schema.organizationmember.profileId, profileId),
        eq(schema.organizationmember.roleId, ROLE.ADMIN)
      )
    )
    .where(
      and(eq(schema.course.id, courseId), or(isNotNull(schema.groupmember.id), isNotNull(schema.organizationmember.id)))
    )
    .limit(1);

  console.log('result', result);
  return result.length > 0;
};

/**
 * Gets a user's role in a course's group
 * @param courseId Course ID
 * @param profileId Profile ID to check
 * @returns Role ID if user is a member, null otherwise
 */
export const getUserCourseRole = async (courseId: string, profileId: string): Promise<number | null> => {
  const result = await db
    .select({ roleId: schema.groupmember.roleId })
    .from(schema.groupmember)
    .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
    .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
    .limit(1);

  return result.length > 0 ? Number(result[0].roleId) : null;
};

/**
 * Checks if a user is either:
 * - a team member (ADMIN or TUTOR) of the course's group, OR
 * - an ADMIN of the organization that owns the course's group.
 *
 * This is designed for middleware use to avoid doing multiple DB queries.
 */
export const isCourseTeamMemberOrOrgAdmin = async (courseId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({
      groupMemberId: schema.groupmember.id,
      orgMemberId: schema.organizationmember.id
    })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(
      schema.groupmember,
      and(
        eq(schema.groupmember.groupId, schema.group.id),
        eq(schema.groupmember.profileId, profileId),
        or(eq(schema.groupmember.roleId, ROLE.ADMIN), eq(schema.groupmember.roleId, ROLE.TUTOR))
      )
    )
    .leftJoin(
      schema.organizationmember,
      and(
        eq(schema.organizationmember.organizationId, schema.group.organizationId),
        eq(schema.organizationmember.profileId, profileId),
        eq(schema.organizationmember.roleId, ROLE.ADMIN)
      )
    )
    .where(
      and(eq(schema.course.id, courseId), or(isNotNull(schema.groupmember.id), isNotNull(schema.organizationmember.id)))
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Gets the group member ID for a user in a course
 * @param courseId Course ID
 * @param profileId Profile ID
 * @returns Group member ID or null if not found
 */
export const getGroupMemberIdByCourseAndProfile = async (
  courseId: string,
  profileId: string
): Promise<string | null> => {
  const result = await db
    .select({ id: schema.groupmember.id })
    .from(schema.groupmember)
    .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
    .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
    .limit(1);

  return result.length > 0 ? result[0].id : null;
};
