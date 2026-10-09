import * as schema from '@db/schema';

import { and, eq, or, type SQL } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export type CohortCourseStaffGrant = {
  cohortId: string;
  courseId: string;
  profileId: string;
};

export type CourseProfilePair = {
  courseId: string;
  profileId: string;
};

export type GroupProfilePair = {
  groupId: string;
  profileId: string;
};

function courseProfilePredicate(pairs: CourseProfilePair[]): SQL | undefined {
  return or(
    ...pairs.map((pair) =>
      and(
        eq(schema.cohortCourseStaffGrant.courseId, pair.courseId),
        eq(schema.cohortCourseStaffGrant.profileId, pair.profileId)
      )
    )
  );
}

function groupProfilePredicate(
  pairs: GroupProfilePair[],
  groupColumn: typeof schema.cohortGrantedGroupMember.groupId,
  profileColumn: typeof schema.cohortGrantedGroupMember.profileId
): SQL | undefined {
  return or(...pairs.map((pair) => and(eq(groupColumn, pair.groupId), eq(profileColumn, pair.profileId))));
}

/** Records each cohort that granted staff access to a course. Existing grants are left in place. */
export async function insertCohortCourseStaffGrants(
  grants: CohortCourseStaffGrant[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (grants.length === 0) return;

  try {
    await dbClient
      .insert(schema.cohortCourseStaffGrant)
      .values(grants)
      .onConflictDoNothing({
        target: [
          schema.cohortCourseStaffGrant.cohortId,
          schema.cohortCourseStaffGrant.courseId,
          schema.cohortCourseStaffGrant.profileId
        ]
      });
  } catch (error) {
    console.error('insertCohortCourseStaffGrants error:', error);
    throw new Error(
      `Failed to insert cohort course staff grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes grants for a cohort, optionally limited to one profile or course.
 * Returns the grants that were removed.
 */
export async function deleteCohortCourseStaffGrants(
  scope: { cohortId: string; profileId?: string; courseId?: string },
  dbClient: DbOrTxClient = db
): Promise<CohortCourseStaffGrant[]> {
  try {
    const filters = [eq(schema.cohortCourseStaffGrant.cohortId, scope.cohortId)];
    if (scope.profileId) {
      filters.push(eq(schema.cohortCourseStaffGrant.profileId, scope.profileId));
    }
    if (scope.courseId) {
      filters.push(eq(schema.cohortCourseStaffGrant.courseId, scope.courseId));
    }

    return await dbClient
      .delete(schema.cohortCourseStaffGrant)
      .where(and(...filters))
      .returning({
        cohortId: schema.cohortCourseStaffGrant.cohortId,
        courseId: schema.cohortCourseStaffGrant.courseId,
        profileId: schema.cohortCourseStaffGrant.profileId
      });
  } catch (error) {
    console.error('deleteCohortCourseStaffGrants error:', error);
    throw new Error(
      `Failed to delete cohort course staff grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Grants that still cover any of the course/profile pairs. */
export async function listCohortCourseStaffGrantsForPairs(
  pairs: CourseProfilePair[],
  dbClient: DbOrTxClient = db
): Promise<CourseProfilePair[]> {
  if (pairs.length === 0) return [];

  try {
    return await dbClient
      .selectDistinct({
        courseId: schema.cohortCourseStaffGrant.courseId,
        profileId: schema.cohortCourseStaffGrant.profileId
      })
      .from(schema.cohortCourseStaffGrant)
      .where(courseProfilePredicate(pairs));
  } catch (error) {
    console.error('listCohortCourseStaffGrantsForPairs error:', error);
    throw new Error(
      `Failed to list cohort course staff grants: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Marks group memberships this enrollment created. Existing markers are left in place. */
export async function insertCohortGrantedGroupMembers(
  pairs: GroupProfilePair[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (pairs.length === 0) return;

  try {
    await dbClient
      .insert(schema.cohortGrantedGroupMember)
      .values(pairs)
      .onConflictDoNothing({
        target: [schema.cohortGrantedGroupMember.groupId, schema.cohortGrantedGroupMember.profileId]
      });
  } catch (error) {
    console.error('insertCohortGrantedGroupMembers error:', error);
    throw new Error(
      `Failed to insert cohort granted group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listCohortGrantedGroupMembers(
  pairs: GroupProfilePair[],
  dbClient: DbOrTxClient = db
): Promise<GroupProfilePair[]> {
  if (pairs.length === 0) return [];

  try {
    return await dbClient
      .select({
        groupId: schema.cohortGrantedGroupMember.groupId,
        profileId: schema.cohortGrantedGroupMember.profileId
      })
      .from(schema.cohortGrantedGroupMember)
      .where(
        groupProfilePredicate(pairs, schema.cohortGrantedGroupMember.groupId, schema.cohortGrantedGroupMember.profileId)
      );
  } catch (error) {
    console.error('listCohortGrantedGroupMembers error:', error);
    throw new Error(
      `Failed to list cohort granted group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteCohortGrantedGroupMembers(
  pairs: GroupProfilePair[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (pairs.length === 0) return;

  try {
    await dbClient
      .delete(schema.cohortGrantedGroupMember)
      .where(
        groupProfilePredicate(pairs, schema.cohortGrantedGroupMember.groupId, schema.cohortGrantedGroupMember.profileId)
      );
  } catch (error) {
    console.error('deleteCohortGrantedGroupMembers error:', error);
    throw new Error(
      `Failed to delete cohort granted group members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
