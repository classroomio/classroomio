import * as schema from '@db/schema';

import { TNewGroup, TNewGroupmember } from '@db/types';
import { and, eq, or } from 'drizzle-orm';

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
 * @returns True if user is a member of the course's group, false otherwise
 */
export const isUserCourseMember = async (courseId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({ roleId: schema.groupmember.roleId })
    .from(schema.groupmember)
    .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
    .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
    .limit(1);

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
 * Checks if a user is a team member (ADMIN or TUTOR) in a course's group
 * @param courseId Course ID
 * @param profileId Profile ID to check
 * @returns True if user is ADMIN or TUTOR in the course's group, false otherwise
 */
export const isUserCourseTeamMember = async (courseId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({ roleId: schema.groupmember.roleId })
    .from(schema.groupmember)
    .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
    .where(
      and(
        eq(schema.course.id, courseId),
        eq(schema.groupmember.profileId, profileId),
        or(eq(schema.groupmember.roleId, ROLE.ADMIN), eq(schema.groupmember.roleId, ROLE.TUTOR))
      )
    )
    .limit(1);

  return result.length > 0;
};
