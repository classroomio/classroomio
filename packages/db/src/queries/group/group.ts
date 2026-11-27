import * as schema from '@db/schema';

import { TGroupmember, TNewGroup, TNewGroupmember } from '@db/types';
import { and, asc, eq, inArray, isNotNull, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isMissingEmail(email: string | null | undefined): boolean {
  return !email || !normalizeEmail(email);
}

export async function createGroup(values: TNewGroup, dbClient: DbOrTxClient = db) {
  try {
    return dbClient.insert(schema.group).values(values).returning();
  } catch (error) {
    console.error('createGroup error:', error);
    throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Adds one group member. A profile that already has a row keeps it; an email-only row for the same email is linked
 * to the profile and given the requested role, so linking never grants a role the caller did not ask for.
 */
export async function addGroupMember(values: TNewGroupmember, dbClient: DbOrTxClient = db) {
  try {
    if (values.profileId) {
      const claim = isMissingEmail(values.email)
        ? null
        : await claimEmailOnlyGroupMembersForGroups(
            [values.groupId],
            [{ profileId: values.profileId, email: values.email }],
            dbClient
          );

      const [existing] = await dbClient
        .select()
        .from(schema.groupmember)
        .where(and(eq(schema.groupmember.groupId, values.groupId), eq(schema.groupmember.profileId, values.profileId)))
        .limit(1);

      const linkedNow = Boolean(claim && claim.claimed > 0);
      if (existing && linkedNow && values.roleId !== undefined && Number(existing.roleId) !== Number(values.roleId)) {
        return dbClient
          .update(schema.groupmember)
          .set({ roleId: values.roleId })
          .where(eq(schema.groupmember.id, existing.id))
          .returning();
      }

      if (existing) {
        return [existing];
      }
    }

    return dbClient.insert(schema.groupmember).values(values).returning();
  } catch (error) {
    console.error('addGroupMember error:', error);
    throw new Error(`Failed to add group member: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Links email-only rows for exactly the requested (group, profile) pairs, never a user's rows in another group of
 * the batch.
 */
async function claimEmailOnlyRowsForPairs(values: TNewGroupmember[], dbClient: DbOrTxClient): Promise<void> {
  const usersByGroup = new Map<string, Array<{ profileId: string; email?: string | null }>>();
  for (const value of values) {
    if (!value.profileId || isMissingEmail(value.email)) continue;

    const users = usersByGroup.get(value.groupId) ?? [];
    users.push({ profileId: value.profileId, email: value.email });
    usersByGroup.set(value.groupId, users);
  }

  for (const [groupId, users] of usersByGroup) {
    await claimEmailOnlyGroupMembersForGroups([groupId], users, dbClient);
  }
}

function insertGroupMemberRows(values: TNewGroupmember[], dbClient: DbOrTxClient) {
  return dbClient.insert(schema.groupmember).values(values).onConflictDoNothing().returning();
}

export async function addGroupMembers(values: TNewGroupmember[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    await claimEmailOnlyRowsForPairs(values, dbClient);

    return insertGroupMemberRows(values, dbClient);
  } catch (error) {
    console.error('addGroupMembers error:', error);
    throw new Error(`Failed to bulk add group members: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type TEmailOnlyClaimResult = {
  claimed: number;
  removedDuplicates: number;
  /** Groups where a STUDENT row was linked. */
  claimedGroupIds: string[];
};

async function claimEmailOnlyGroupRows(
  scope: SQL,
  profileId: string,
  email: string,
  dbClient: DbOrTxClient
): Promise<TEmailOnlyClaimResult> {
  const normalizedEmail = normalizeEmail(email);
  const emailOnlyRow = and(
    scope,
    isNull(schema.groupmember.profileId),
    eq(sql`lower(trim(${schema.groupmember.email}))`, normalizedEmail)
  );

  const removed = await dbClient
    .delete(schema.groupmember)
    .where(
      and(
        emailOnlyRow,
        or(
          sql`exists (select 1 from ${schema.groupmember} as kept where kept.group_id = ${schema.groupmember.groupId} and kept.profile_id = ${profileId})`,
          sql`exists (select 1 from ${schema.groupmember} as kept where kept.group_id = ${schema.groupmember.groupId} and kept.profile_id is null and lower(trim(kept.email)) = ${normalizedEmail} and kept.id < ${schema.groupmember.id})`
        )
      )
    )
    .returning({ id: schema.groupmember.id });

  const claimedRows = await dbClient
    .update(schema.groupmember)
    .set({ profileId })
    .where(emailOnlyRow)
    .returning({ groupId: schema.groupmember.groupId, roleId: schema.groupmember.roleId });

  return {
    claimed: claimedRows.length,
    removedDuplicates: removed.length,
    claimedGroupIds: claimedRows.filter((row) => Number(row.roleId) === ROLE.STUDENT).map((row) => row.groupId)
  };
}

function mergeClaimResults(results: TEmailOnlyClaimResult[]): TEmailOnlyClaimResult {
  return {
    claimed: results.reduce((sum, result) => sum + result.claimed, 0),
    removedDuplicates: results.reduce((sum, result) => sum + result.removedDuplicates, 0),
    claimedGroupIds: [...new Set(results.flatMap((result) => result.claimedGroupIds))]
  };
}

/**
 * Links each user's email-only rows in these groups to their profile. Where the profile already has a row in a
 * group, the email-only duplicate is deleted instead. Returns counts and the groups that gained a linked student row.
 */
export async function claimEmailOnlyGroupMembersForGroups(
  groupIds: string[],
  users: Array<{ profileId: string; email?: string | null }>,
  dbClient: DbOrTxClient = db
): Promise<TEmailOnlyClaimResult> {
  const uniqueGroupIds = [...new Set(groupIds)];
  const claimableUsers = users.filter((user) => !isMissingEmail(user.email));

  if (uniqueGroupIds.length === 0 || claimableUsers.length === 0) {
    return { claimed: 0, removedDuplicates: 0, claimedGroupIds: [] };
  }

  try {
    const scope = inArray(schema.groupmember.groupId, uniqueGroupIds);
    const results: TEmailOnlyClaimResult[] = [];
    for (const user of claimableUsers) {
      results.push(await claimEmailOnlyGroupRows(scope, user.profileId, user.email!, dbClient));
    }

    return mergeClaimResults(results);
  } catch (error) {
    console.error('claimEmailOnlyGroupMembersForGroups error:', error);
    throw new Error(
      `Failed to claim email-only group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Links every email-only row for `email` in the organization's groups to `profileId`, with the same duplicate rule
 * as `claimEmailOnlyGroupMembersForGroups`.
 */
export async function claimEmailOnlyGroupMembers(
  orgId: string,
  email: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TEmailOnlyClaimResult> {
  if (isMissingEmail(email)) return { claimed: 0, removedDuplicates: 0, claimedGroupIds: [] };

  try {
    const scope = sql`${schema.groupmember.groupId} in (select ${schema.group.id} from ${schema.group} where ${schema.group.organizationId} = ${orgId})`;

    return await claimEmailOnlyGroupRows(scope, profileId, email, dbClient);
  } catch (error) {
    console.error('claimEmailOnlyGroupMembers error:', error);
    throw new Error(
      `Failed to claim email-only group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getExistingGroupMembers(
  pairs: Array<{ groupId: string; profileId: string; email?: string | null }>,
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

    const existing = new Set(rows.map((r) => `${r.groupId}:${r.profileId}`));

    const profileIdByGroupAndEmail = new Map<string, string>();
    const emails = new Set<string>();
    for (const pair of pairs) {
      if (!isMissingEmail(pair.email)) {
        const normalizedEmail = normalizeEmail(pair.email!);
        profileIdByGroupAndEmail.set(`${pair.groupId}:${normalizedEmail}`, pair.profileId);
        emails.add(normalizedEmail);
      }
    }

    if (emails.size > 0) {
      const emailOnlyRows = await dbClient
        .select({ groupId: schema.groupmember.groupId, email: schema.groupmember.email })
        .from(schema.groupmember)
        .where(
          and(
            inArray(schema.groupmember.groupId, groupIds),
            isNull(schema.groupmember.profileId),
            inArray(sql`lower(trim(${schema.groupmember.email}))`, [...emails])
          )
        );

      for (const row of emailOnlyRows) {
        if (!row.email) continue;

        const profileId = profileIdByGroupAndEmail.get(`${row.groupId}:${normalizeEmail(row.email)}`);
        if (profileId) {
          existing.add(`${row.groupId}:${profileId}`);
        }
      }
    }

    return existing;
  } catch (error) {
    console.error('getExistingGroupMembers error:', error);
    throw new Error(
      `Failed to check existing group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Enroll users in course groups, skipping any existing memberships.
 * Returns the newly inserted memberships.
 */
export async function enrollUsersInCourseGroups(
  groupIds: string[],
  users: Array<{ profileId: string; email?: string }>,
  roleId: number,
  dbClient: DbOrTxClient = db
): Promise<TGroupmember[]> {
  if (groupIds.length === 0 || users.length === 0) return [];

  await claimEmailOnlyGroupMembersForGroups(groupIds, users, dbClient);

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
  if (toInsert.length === 0) return [];

  return insertGroupMemberRows(toInsert, dbClient);
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
 * Course-group member (any role) or org ADMIN. Both require live, `ACTIVE` org
 * membership — a `groupmember` row outlives removal from the org. This join is
 * the single place course access is revoked.
 *
 * Designed for middleware use, to avoid multiple DB queries.
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
        eq(schema.organizationmember.roleId, ROLE.ADMIN),
        eq(schema.organizationmember.status, 'ACTIVE')
      )
    )
    .leftJoin(
      orgMembership,
      and(
        eq(orgMembership.organizationId, schema.group.organizationId),
        eq(orgMembership.profileId, profileId),
        eq(orgMembership.status, 'ACTIVE')
      )
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
 * Requires live, `ACTIVE` org membership, as `isUserCourseMemberOrOrgAdmin` does.
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
        eq(schema.organizationmember.roleId, ROLE.ADMIN),
        eq(schema.organizationmember.status, 'ACTIVE')
      )
    )
    .leftJoin(
      orgMembership,
      and(
        eq(orgMembership.organizationId, schema.group.organizationId),
        eq(orgMembership.profileId, profileId),
        eq(orgMembership.status, 'ACTIVE')
      )
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
 * Active org tutor who mentors a cohort that includes this course.
 * Cohort role must be ADMIN or TUTOR. Org-only tutors are not included.
 */
export const isActiveOrgTutorOfCourseCohort = async (courseId: string, profileId: string): Promise<boolean> => {
  const result = await db
    .select({ cohortMemberId: schema.cohortMember.id })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .innerJoin(
      schema.organizationmember,
      and(
        eq(schema.organizationmember.organizationId, schema.group.organizationId),
        eq(schema.organizationmember.profileId, profileId),
        eq(schema.organizationmember.roleId, ROLE.TUTOR),
        eq(schema.organizationmember.status, 'ACTIVE')
      )
    )
    .innerJoin(schema.cohort, eq(schema.cohort.organizationId, schema.group.organizationId))
    .innerJoin(
      schema.cohortCourse,
      and(eq(schema.cohortCourse.cohortId, schema.cohort.id), eq(schema.cohortCourse.courseId, schema.course.id))
    )
    .innerJoin(
      schema.cohortMember,
      and(
        eq(schema.cohortMember.cohortId, schema.cohort.id),
        eq(schema.cohortMember.profileId, profileId),
        or(eq(schema.cohortMember.roleId, ROLE.ADMIN), eq(schema.cohortMember.roleId, ROLE.TUTOR))
      )
    )
    .where(eq(schema.course.id, courseId))
    .limit(1);

  return result.length > 0;
};

/**
 * Course group ADMIN/TUTOR, org ADMIN, or an active org tutor who mentors a cohort
 * that includes the course. Students and org-only tutors return false.
 */
export const canAccessCourseSubmissions = async (courseId: string, profileId: string): Promise<boolean> => {
  const isTeamOrOrgAdmin = await isCourseTeamMemberOrOrgAdmin(courseId, profileId);

  if (isTeamOrOrgAdmin) {
    return true;
  }

  return isActiveOrgTutorOfCourseCohort(courseId, profileId);
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
 * Sets a profile's course roles in one org to their current org role. Role ids ascend by
 * privilege (ADMIN 1, TUTOR 2, STUDENT 3), so this demotes outranking course roles and
 * promotes lagging ones — a student invited as tutor or admin teaches every course
 * they already belong to, and a demoted member keeps no elevated course access.
 *
 * @returns the number of course roles that were updated
 */
export async function syncCourseRolesToOrgRole(
  orgId: string,
  profileId: string,
  orgRoleId: number,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const orgGroupIds = dbClient
      .select({ id: schema.group.id })
      .from(schema.group)
      .where(eq(schema.group.organizationId, orgId));

    const updated = await dbClient
      .update(schema.groupmember)
      .set({ roleId: orgRoleId })
      .where(
        and(
          eq(schema.groupmember.profileId, profileId),
          ne(schema.groupmember.roleId, orgRoleId),
          inArray(schema.groupmember.groupId, orgGroupIds)
        )
      )
      .returning({ id: schema.groupmember.id });

    return updated.length;
  } catch (error) {
    console.error('syncCourseRolesToOrgRole error:', error);
    throw new Error(`Failed to sync course roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          // Feeds `ensureCourseGroupMemberId`, which can create a membership.
          eq(schema.organizationmember.status, 'ACTIVE')
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
): Promise<TGroupmember[]> {
  if (values.length === 0) return [];

  try {
    await claimEmailOnlyRowsForPairs(values, dbClient);

    return await insertGroupMemberRows(values, dbClient);
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
