import { and, count, eq, isNull } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import type { TCourseEnrollmentGrant, TNewCourseEnrollmentGrant } from '../../types';

/**
 * Grants access to a course and records its provenance.
 * Idempotent via unique constraint on (groupmemberId, courseId, source, cohortId, learningPathId).
 */
export async function grantCourseAccess(
  data: TNewCourseEnrollmentGrant,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant> {
  try {
    const [created] = await dbClient
      .insert(schema.courseEnrollmentGrant)
      .values(data)
      .onConflictDoNothing()
      .returning();

    if (created) {
      return created;
    }

    // Retrieve existing grant if conflict occurred
    const [existing] = await dbClient
      .select()
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.groupmemberId, data.groupmemberId),
          eq(schema.courseEnrollmentGrant.courseId, data.courseId),
          eq(schema.courseEnrollmentGrant.source, data.source),
          data.learningPathId
            ? eq(schema.courseEnrollmentGrant.learningPathId, data.learningPathId)
            : isNull(schema.courseEnrollmentGrant.learningPathId),
          data.cohortId
            ? eq(schema.courseEnrollmentGrant.cohortId, data.cohortId)
            : isNull(schema.courseEnrollmentGrant.cohortId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error('Failed to record course enrollment grant');
    }

    return existing;
  } catch (error) {
    console.error('grantCourseAccess error:', error);
    throw new Error(`Failed to grant course access: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Revokes all active learning path grants for a student in a specific path.
 */
export async function revokeLearningPathGrants(
  learningPathId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await dbClient
      .update(schema.courseEnrollmentGrant)
      .set({ revokedAt: nowIso })
      .where(
        and(
          eq(schema.courseEnrollmentGrant.learningPathId, learningPathId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      );
  } catch (error) {
    console.error('revokeLearningPathGrants error:', error);
    throw new Error(
      `Failed to revoke learning path grants for path "${learningPathId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the count of active (non-revoked) grants for a given groupmember row.
 */
export async function getActiveGrantCount(groupmemberId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [countRow] = await dbClient
      .select({ count: count(schema.courseEnrollmentGrant.id) })
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      );

    return Number(countRow?.count ?? 0);
  } catch (error) {
    console.error('getActiveGrantCount error:', error);
    throw new Error(
      `Failed to get active grant count for groupmember "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists all grants for a given groupmember row.
 */
export async function getGrantsForMember(
  groupmemberId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseEnrollmentGrant)
      .where(eq(schema.courseEnrollmentGrant.groupmemberId, groupmemberId));
  } catch (error) {
    console.error('getGrantsForMember error:', error);
    throw new Error(
      `Failed to get grants for groupmember "${groupmemberId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists active grants for a profile in a course.
 */
export async function getActiveGrantsForCourseAndProfile(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant[]> {
  try {
    return await dbClient
      .select()
      .from(schema.courseEnrollmentGrant)
      .where(
        and(
          eq(schema.courseEnrollmentGrant.courseId, courseId),
          eq(schema.courseEnrollmentGrant.profileId, profileId),
          isNull(schema.courseEnrollmentGrant.revokedAt)
        )
      );
  } catch (error) {
    console.error('getActiveGrantsForCourseAndProfile error:', error);
    throw new Error(
      `Failed to get active grants for course "${courseId}" and profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
