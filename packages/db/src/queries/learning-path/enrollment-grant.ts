import { and, count, eq, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import * as schema from '../../schema';
import type { TCourseEnrollmentGrant, TNewCourseEnrollmentGrant } from '../../types';

/**
 * Grants access to a course and records its provenance.
 * Idempotent via unique constraint on (groupmemberId, courseId, source, cohortId, learningPathId);
 * an existing revoked grant is reactivated so re-adding a member restores their course access.
 */
export async function grantCourseAccess(
  data: TNewCourseEnrollmentGrant,
  dbClient: DbOrTxClient = db
): Promise<TCourseEnrollmentGrant> {
  try {
    const [granted] = await dbClient
      .insert(schema.courseEnrollmentGrant)
      .values(data)
      .onConflictDoUpdate({
        target: [
          schema.courseEnrollmentGrant.groupmemberId,
          schema.courseEnrollmentGrant.courseId,
          schema.courseEnrollmentGrant.source,
          schema.courseEnrollmentGrant.cohortId,
          schema.courseEnrollmentGrant.learningPathId
        ],
        set: {
          revokedAt: null,
          grantedAt: sql`now()`,
          grantedByProfileId: sql`EXCLUDED.granted_by_profile_id`
        }
      })
      .returning();

    if (!granted) {
      throw new Error('Failed to record course enrollment grant');
    }

    return granted;
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
