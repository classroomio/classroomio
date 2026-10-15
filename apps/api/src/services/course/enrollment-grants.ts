import { type DbOrTxClient, db } from '@cio/db/drizzle';
import { bulkInsertDirectCourseGrants, grantCourseAccess } from '@cio/db/queries/learning-path';
import type { TCourseEnrollmentGrant } from '@cio/db/types';

/**
 * Direct (non-path, non-cohort) grant sources. Learning-path and cohort
 * enrollments record their own provenance where the membership is created.
 */
export type TDirectGrantSource = 'SELF_ENROLL' | 'INVITE' | 'ADMIN_ADD' | 'ORG_AUDIENCE';

export type TGrantSource = TCourseEnrollmentGrant['source'];

export interface TDirectCourseGrant {
  groupmemberId: string;
  courseId: string;
  profileId: string | null;
}

/**
 * Records provenance for one direct course membership. Idempotent via the
 * grant upsert (reactivates a revoked grant), so re-running repairs rows
 * created before the ledger existed.
 */
export async function recordDirectCourseGrant(
  entry: TDirectCourseGrant,
  input: { source: TDirectGrantSource; grantedByProfileId?: string },
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await grantCourseAccess(
      {
        groupmemberId: entry.groupmemberId,
        courseId: entry.courseId,
        profileId: entry.profileId,
        source: input.source,
        grantedByProfileId: input.grantedByProfileId
      },
      dbClient
    );
  } catch (error) {
    console.error('recordDirectCourseGrant error:', error);
    throw error;
  }
}

/**
 * Records provenance for many memberships in a single statement.
 * Only covers memberships that exist (inner join), so it both grants new
 * rows and repairs pre-ledger ones. Duplicate-safe via the source unique
 * constraint, which treats NULL cohort/path ids as colliding.
 *
 * Thin wrapper over the query-layer bulk insert so services never embed SQL.
 */
export async function recordDirectCourseGrantsBulk(
  input: {
    groupIds: string[];
    profileIds: string[];
    courseIds: string[];
    source: TGrantSource;
    cohortId?: string;
    learningPathId?: string;
    grantedByProfileId?: string;
  },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    return await bulkInsertDirectCourseGrants(input, dbClient);
  } catch (error) {
    console.error('recordDirectCourseGrantsBulk error:', error);
    throw error;
  }
}
