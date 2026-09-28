import { sql } from 'drizzle-orm';

import { type DbOrTxClient, db } from '@cio/db/drizzle';
import { grantCourseAccess } from '@cio/db/queries/learning-path';
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
}

/**
 * Records provenance for many memberships in a single statement.
 * Only covers memberships that exist (inner join), so it both grants new
 * rows and repairs pre-ledger ones. Duplicate-safe via the source unique
 * constraint, which treats NULL cohort/path ids as colliding.
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
  if (input.groupIds.length === 0 || input.profileIds.length === 0 || input.courseIds.length === 0) {
    return 0;
  }

  const completed = await dbClient.execute(sql`
    INSERT INTO course_enrollment_grant (groupmember_id, course_id, profile_id, source, cohort_id, learning_path_id, granted_by_profile_id, granted_at)
    SELECT gm.id, c.id, gm.profile_id, ${input.source}, ${input.cohortId ?? null}, ${input.learningPathId ?? null}, ${input.grantedByProfileId ?? null}, now()
    FROM groupmember gm
    JOIN course c ON c.group_id = gm.group_id
    WHERE gm.group_id = ANY(${input.groupIds})
      AND gm.profile_id = ANY(${input.profileIds})
      AND c.id = ANY(${input.courseIds})
    ON CONFLICT (groupmember_id, course_id, source, cohort_id, learning_path_id) DO NOTHING
    RETURNING id
  `);

  const rows = (completed as { rows?: unknown[] }).rows;

  return Array.isArray(rows) ? rows.length : 0;
}
