import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import type { TCoursePeopleSource } from '@cio/utils/validation/course';

export type CoursePeopleSourceFilter = TCoursePeopleSource;

/**
 * Enrollment-source ("how did this member reach the course") SQL for the course
 * People queries. It lives outside `people.ts` so the roster rewrite in
 * classroomio/classroomio#1226 can adopt it without conflicting line-by-line.
 *
 * TODO(#1226): after the URL-backed roster merges, in `getPaginatedCourseMembers`:
 * - keep `source` in the destructured options and push `sourceCondition(courseId, source)`
 *   onto `conditions` (it must reach the count query too, so totals match the filter);
 * - keep `...latestGrantSourceColumns(courseId)` in the row `select` and copy
 *   `enrollmentSource`, `enrollmentSourcePathPublicId` and `enrollmentSourceCohortId`
 *   into the PR's inline row mapping (`PaginatedCourseMember` extends
 *   `CourseMemberWithProfile`, so leaving them out is a type error).
 */

/**
 * Latest non-revoked grant value for one course membership, read from a
 * single grant row (ordered by granted_at DESC) so every column built from
 * it describes the same grant. Null when the grant ledger has no row
 * (pre-ledger enrollments).
 */
function latestGrantValueSql(courseId: string, value: SQL, join?: SQL): SQL<string | null> {
  return sql<string | null>`(
    SELECT ${value}
    FROM ${schema.courseEnrollmentGrant} ceg
    ${join ?? sql``}
    WHERE ceg.groupmember_id = ${schema.groupmember.id}
      AND ceg.course_id = ${courseId}
      AND ceg.revoked_at IS NULL
    ORDER BY ceg.granted_at DESC
    LIMIT 1
  )`;
}

function latestGrantSourceSql(courseId: string): SQL<string | null> {
  return latestGrantValueSql(courseId, sql`ceg.source::text`);
}

/**
 * Latest grant provenance for People views that show whether a learner
 * arrived directly, via cohort, or via a learning path. The path column
 * resolves the learning path's publicId (what `/paths/[publicId]` routes on),
 * not its internal uuid; cohorts route on the internal id so cohort_id is
 * returned as-is.
 */
export function latestGrantSourceColumns(courseId: string) {
  return {
    enrollmentSource: latestGrantSourceSql(courseId).as('enrollmentSource'),
    enrollmentSourcePathPublicId: latestGrantValueSql(
      courseId,
      sql`lp.public_id`,
      sql`LEFT JOIN ${schema.learningPath} lp ON lp.id = ceg.learning_path_id`
    ).as('enrollmentSourcePathPublicId'),
    enrollmentSourceCohortId: latestGrantValueSql(courseId, sql`ceg.cohort_id`).as('enrollmentSourceCohortId')
  };
}

/** Grant sources that count as arriving through another resource rather than directly. */
const INDIRECT_GRANT_SOURCES = { learning_path: 'LEARNING_PATH', cohort: 'COHORT' } as const;

/**
 * Filters members by how they reached the course. `direct` is the complement
 * of the indirect sources, so it also keeps members with no grant row.
 */
export function sourceCondition(courseId: string, source: CoursePeopleSourceFilter): SQL {
  const latestSource = latestGrantSourceSql(courseId);

  if (source === 'direct') {
    const indirectSources = sql.join(
      Object.values(INDIRECT_GRANT_SOURCES).map((value) => sql`${value}`),
      sql`, `
    );

    return sql`COALESCE(${latestSource}, '') NOT IN (${indirectSources})`;
  }

  return sql`${latestSource} = ${INDIRECT_GRANT_SOURCES[source]}`;
}
