import * as schema from '@db/schema';

import { TNewGroup, TNewGroupmember } from '@db/types';
import { and, asc, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

export async function createGroup(values: TNewGroup, dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.group).values(values).returning();
  } catch (error) {
    console.error('createGroup error:', error);
    throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addGroupMember(values: TNewGroupmember, dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.groupmember).values(values).returning();
  } catch (error) {
    console.error('addGroupMember error:', error);
    throw new Error(`Failed to add group member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function addGroupMembers(values: TNewGroupmember[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    return dbClient.insert(schema.groupmember).values(values).returning();
  } catch (error) {
    console.error('addGroupMembers error:', error);
    throw new Error(`Failed to bulk add group members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getExistingGroupMembers(
  pairs: Array<{ groupId: string; profileId: string }>,
  dbClient: DbOrTxClient = db
): Promise<Set<string>> {
  if (pairs.length === 0) return new Set();

  try {
    const groupIds = [...new Set(pairs.map((p) => p.groupId))];
    const profileIds = [...new Set(pairs.map((p) => p.profileId))];

    const rows = await dbClient
      .select({ groupId: schema.groupmember.groupId, profileId: schema.groupmember.profileId })
      .from(schema.groupmember)
      .where(and(inArray(schema.groupmember.groupId, groupIds), inArray(schema.groupmember.profileId, profileIds)));

    return new Set(rows.map((r) => `${r.groupId}:${r.profileId}`));
  } catch (error) {
    console.error('getExistingGroupMembers error:', error);
    throw new Error(
      `Failed to check existing group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Enroll users in course groups, skipping any existing memberships.
 * Returns the count of newly inserted memberships.
 */
export async function enrollUsersInCourseGroups(
  groupIds: string[],
  users: Array<{ profileId: string; email?: string }>,
  roleId: number,
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (groupIds.length === 0 || users.length === 0) return 0;

  const pairs = users.flatMap((u) => groupIds.map((groupId) => ({ groupId, profileId: u.profileId })));
  const existingSet = await getExistingGroupMembers(pairs, dbClient);
  const emailByProfile = new Map(users.map((u) => [u.profileId, u.email]));

  const toInsert = pairs
    .filter((p) => !existingSet.has(`${p.groupId}:${p.profileId}`))
    .map((p) => ({
      groupId: p.groupId,
      roleId,
      profileId: p.profileId,
      email: emailByProfile.get(p.profileId) ?? undefined
    }));

  if (toInsert.length > 0) {
    await addGroupMembers(toInsert, dbClient);
  }

  return toInsert.length;
}

/**
 * Checks if a profile is already a member of a specific group
 * @param groupId Group ID
 * @param profileId Profile ID
 * @returns true if the user is already a member
 */
export async function isGroupMember(groupId: string, profileId: string): Promise<boolean> {
  try {
    const [existing] = await db
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    return !!existing;
  } catch (error) {
    console.error('isGroupMember error:', error);
    throw new Error(`Failed to check group membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Both require live org membership: a `groupmember` row outlives removal from the org.
 *
 * This is designed for middleware use to avoid doing multiple DB queries.
 */
export const isUserCourseMemberOrOrgAdmin = async (courseId: string, profileId: string): Promise<boolean> => {
  const orgMembership = alias(schema.organizationmember, 'org_membership');

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
    .leftJoin(
      orgMembership,
      and(eq(orgMembership.organizationId, schema.group.organizationId), eq(orgMembership.profileId, profileId))
    )
    .where(
      and(
        eq(schema.course.id, courseId),
        or(isNull(schema.group.organizationId), isNotNull(orgMembership.id)),
        or(isNotNull(schema.groupmember.id), isNotNull(schema.organizationmember.id))
      )
    )
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
 * Checks if a user is either:
 * - a team member (ADMIN or TUTOR) of the course's group, OR
 * - an ADMIN of the organization that owns the course's group.
 *
 * Requires live org membership, as `isUserCourseMemberOrOrgAdmin` does.
 *
 * This is designed for middleware use to avoid doing multiple DB queries.
 */
export const isCourseTeamMemberOrOrgAdmin = async (courseId: string, profileId: string): Promise<boolean> => {
  const orgMembership = alias(schema.organizationmember, 'org_membership');

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
    .leftJoin(
      orgMembership,
      and(eq(orgMembership.organizationId, schema.group.organizationId), eq(orgMembership.profileId, profileId))
    )
    .where(
      and(
        eq(schema.course.id, courseId),
        or(isNull(schema.group.organizationId), isNotNull(orgMembership.id)),
        or(isNotNull(schema.groupmember.id), isNotNull(schema.organizationmember.id))
      )
    )
    .limit(1);

  return result.length > 0;
};

/**
 * Resolves program-based access to a course.
 * Returns the course group/org context plus the matched program member role.
 */
export async function getCourseProgramAccess(
  courseId: string,
  profileId: string
): Promise<{
  courseId: string;
  courseGroupId: string;
  organizationId: string | null;
  profileEmail: string | null;
  roleId: number;
} | null> {
  try {
    const result = await db
      .select({
        courseId: schema.course.id,
        courseGroupId: schema.group.id,
        organizationId: schema.group.organizationId,
        profileEmail: schema.profile.email,
        roleId: schema.programMember.roleId
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.programCourse, eq(schema.course.id, schema.programCourse.courseId))
      .innerJoin(
        schema.program,
        and(eq(schema.program.id, schema.programCourse.programId), eq(schema.program.status, 'ACTIVE'))
      )
      .innerJoin(
        schema.programMember,
        and(eq(schema.programMember.programId, schema.program.id), eq(schema.programMember.profileId, profileId))
      )
      .leftJoin(schema.profile, eq(schema.programMember.profileId, schema.profile.id))
      .where(eq(schema.course.id, courseId))
      .orderBy(asc(schema.programMember.roleId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0],
      roleId: Number(result[0].roleId)
    };
  } catch (error) {
    console.error('getCourseProgramAccess error:', error);
    throw new Error(`Failed to get course program access: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Raises a profile's course roles in one org to at least their org role, so they never
 * outrank it. Role ids ascend by privilege (ADMIN 1, TUTOR 2, STUDENT 3), so this only
 * demotes — a deliberately lower course role is preserved.
 *
 * @returns the number of course roles that were demoted
 */
export async function clampCourseRolesToOrgRole(
  orgId: string,
  profileId: string,
  orgRoleId: number,
  dbClient: DbOrTxClient = db
): Promise<number> {
  const outrankingRoles = Array.from({ length: Math.max(0, orgRoleId - 1) }, (_, index) => index + 1);
  if (outrankingRoles.length === 0) return 0;

  try {
    const orgGroupIds = dbClient
      .select({ id: schema.group.id })
      .from(schema.group)
      .where(eq(schema.group.organizationId, orgId));

    const demoted = await dbClient
      .update(schema.groupmember)
      .set({ roleId: orgRoleId })
      .where(
        and(
          eq(schema.groupmember.profileId, profileId),
          inArray(schema.groupmember.roleId, outrankingRoles),
          inArray(schema.groupmember.groupId, orgGroupIds)
        )
      )
      .returning({ id: schema.groupmember.id });

    return demoted.length;
  } catch (error) {
    console.error('clampCourseRolesToOrgRole error:', error);
    throw new Error(`Failed to clamp course roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Resolves the course group an org ADMIN may act in before they have a `groupmember` row.
 * Returns null when the profile is not an admin of the course's organization.
 */
export async function getCourseOrgAdminAccess(
  courseId: string,
  profileId: string
): Promise<{ courseGroupId: string; organizationId: string | null } | null> {
  try {
    const result = await db
      .select({
        courseGroupId: schema.group.id,
        organizationId: schema.group.organizationId
      })
      .from(schema.course)
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(
        schema.organizationmember,
        and(
          eq(schema.organizationmember.organizationId, schema.group.organizationId),
          eq(schema.organizationmember.profileId, profileId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN)
        )
      )
      .where(eq(schema.course.id, courseId))
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error('getCourseOrgAdminAccess error:', error);
    throw new Error(
      `Failed to get course org admin access: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

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

export async function getGroupMemberIdByGroupAndProfile(
  groupId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await dbClient
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('getGroupMemberIdByGroupAndProfile error:', error);
    throw new Error(`Failed to resolve group membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function insertGroupMembersOnConflictDoNothing(
  values: TNewGroupmember[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (values.length === 0) return;

  try {
    await dbClient.insert(schema.groupmember).values(values).onConflictDoNothing();
  } catch (error) {
    console.error('insertGroupMembersOnConflictDoNothing error:', error);
    throw new Error(`Failed to insert group members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getOrgIdsByGroupIds(groupIds: string[]): Promise<string[]> {
  if (groupIds.length === 0) {
    return [];
  }

  try {
    const rows = await db
      .selectDistinct({ orgId: schema.group.organizationId })
      .from(schema.group)
      .where(inArray(schema.group.id, groupIds));

    return rows.map((row) => row.orgId).filter((orgId): orgId is string => Boolean(orgId));
  } catch (error) {
    console.error('getOrgIdsByGroupIds error:', error);
    throw new Error(
      `Failed to get organization IDs for groups: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
