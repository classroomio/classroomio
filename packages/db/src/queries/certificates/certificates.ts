import * as schema from '@db/schema';

import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';
import { toContainsPattern } from '@db/utils/like-pattern';
import { complianceCycleIsCompleteSql, courseIsCompleteSql, latestComplianceCte } from '../course/learner-progress';

export interface TEarnedCourseCertificate {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  logo: string;
  type: string;
  earnedAt: string | null;
  certificateAvailable: boolean;
  /** When the certificate stops being valid. Only compliance certificates expire; null otherwise. */
  validUntil: string | null;
  /** The certificate's validity ended: the learner is due to retake the compliance course. */
  isExpired: boolean;
}

export interface TEarnedPathCertificate {
  id: string;
  publicId: string;
  name: string;
  description: string;
  slug: string | null;
  coverImage: string | null;
  courseCount: number;
  certificateId: string | null;
  earnedAt: string | null;
  certificateAvailable: boolean;
}

export type TEarnedCertificate =
  | { kind: 'course'; data: TEarnedCourseCertificate }
  | { kind: 'learning_path'; data: TEarnedPathCertificate };

export interface TEarnedCertificatesPage {
  items: TEarnedCertificate[];
  /** Certificates matching the search, for pagination. */
  total: number;
}

interface GetEarnedCertificatesOptions {
  orgId: string;
  profileId: string;
  limit: number;
  page: number;
  certificatesEnabled: boolean;
  /** Case-insensitive match on course titles and path names. */
  search?: string;
}

type TCompletedWorkBaseRow = {
  item_id: string;
  title: string;
  description: string;
  slug: string | null;
  earned_at: string | null;
  certificate_available: boolean;
};

type TCompletedWorkRow =
  | (TCompletedWorkBaseRow & {
      kind: 'course';
      cover_image: string;
      course_type: string;
      valid_until: string | null;
      is_expired: boolean;
    })
  | (TCompletedWorkBaseRow & {
      kind: 'learning_path';
      cover_image: string | null;
      public_id: string;
      course_count: number;
      certificate_id: string | null;
    });

/**
 * The `latest_compliance` and `completed_work` CTEs: every course and learning
 * path the learner completed in the org, read from what completion
 * evaluation recorded rather than recomputed, while the learner holds an
 * unrevoked enrollment grant. A course is listed once it was ever completed
 * (`groupmember.completed_at`, or for compliance any completed cycle) or is
 * complete now per `courseIsCompleteSql` (a waived compliance cycle). A
 * compliance certificate stays listed after it lapses, dated by the latest
 * completed cycle and marked `is_expired`, while My Learning shows the
 * course due again. A path counts while its member row is `COMPLETED`,
 * which progress sync reverts when the path gains an unfinished course; the
 * download guard reads the same flag. `certificate_available` mirrors the
 * download guards: the plan includes certificates, the item allows downloads,
 * and the learner met the course rule or, for a path, holds a valid issued
 * certificate.
 */
function completedWorkCtes({ orgId, profileId, certificatesEnabled }: GetEarnedCertificatesOptions): SQL {
  const courseIsComplete = courseIsCompleteSql({
    courseType: sql`c.type::text`,
    memberCompletedAt: sql`gm.completed_at`,
    complianceCycleComplete: complianceCycleIsCompleteSql(sql`lc`)
  });

  return sql`
    ${latestComplianceCte(profileId)},
    live_grant_courses AS (
      SELECT DISTINCT ceg.course_id
      FROM ${schema.courseEnrollmentGrant} ceg
      WHERE ceg.profile_id = ${profileId} AND ceg.revoked_at IS NULL
    ),
    completed_work AS (
      SELECT 'course' AS kind,
        c.id AS item_id,
        c.title,
        c.description,
        c.slug,
        c.logo AS cover_image,
        c.type::text AS course_type,
        NULL AS public_id,
        NULL::int AS course_count,
        NULL AS certificate_id,
        CASE WHEN c.type = 'COMPLIANCE' THEN last_completed.completed_at ELSE gm.completed_at END AS earned_at,
        (${certificatesEnabled}
          AND c.certificate->>'isDownloadable' = 'true'
          AND gm.completed_at IS NOT NULL) AS certificate_available,
        last_completed.valid_until,
        COALESCE(last_completed.valid_until <= now(), false) AS is_expired
      FROM live_grant_courses lgc
      JOIN ${schema.course} c ON c.id = lgc.course_id AND c.status = 'ACTIVE'
      JOIN ${schema.group} g ON g.id = c.group_id AND g.organization_id = ${orgId}
      JOIN ${schema.groupmember} gm ON gm.group_id = c.group_id AND gm.profile_id = ${profileId}
      LEFT JOIN latest_compliance lc ON lc.course_id = c.id
      LEFT JOIN LATERAL (
        SELECT ccr.completed_at, ccr.valid_until
        FROM ${schema.courseCompletionRecord} ccr
        WHERE c.type = 'COMPLIANCE'
          AND ccr.course_id = c.id
          AND ccr.profile_id = ${profileId}
          AND ccr.completed_at IS NOT NULL
        ORDER BY ccr.cycle_number DESC
        LIMIT 1
      ) last_completed ON true
      WHERE ${courseIsComplete} OR gm.completed_at IS NOT NULL OR last_completed.completed_at IS NOT NULL

      UNION ALL

      SELECT 'learning_path' AS kind,
        learning_path.id AS item_id,
        learning_path.name AS title,
        learning_path.description,
        learning_path.slug,
        learning_path.cover_image,
        NULL AS course_type,
        learning_path.public_id,
        (
          SELECT COUNT(*)::int
          FROM ${schema.learningPathCourse} lpc
          JOIN ${schema.course} path_course ON path_course.id = lpc.course_id AND path_course.status = 'ACTIVE'
          WHERE lpc.learning_path_id = learning_path.id AND lpc.removed_at IS NULL
        ) AS course_count,
        ci.certificate_id,
        lpm.completed_at AS earned_at,
        (${certificatesEnabled}
          AND learning_path.certificate->>'isDownloadable' = 'true'
          AND ci.certificate_id IS NOT NULL) AS certificate_available,
        NULL::timestamptz AS valid_until,
        false AS is_expired
      FROM ${schema.learningPathMember} lpm
      JOIN ${schema.learningPath} ON learning_path.id = lpm.learning_path_id
        AND learning_path.organization_id = ${orgId}
        AND learning_path.status = 'ACTIVE'
      LEFT JOIN ${schema.learningPathCertificateIssue} ci ON ci.learning_path_member_id = lpm.id
        AND ci.status = 'valid'
        AND ci.revoked_at IS NULL
      WHERE lpm.profile_id = ${profileId}
        AND lpm.removed_at IS NULL
        AND lpm.role_id = ${ROLE.STUDENT}
        AND lpm.status = 'COMPLETED'
    )
  `;
}

function toEarnedCertificate(row: TCompletedWorkRow): TEarnedCertificate {
  if (row.kind === 'learning_path') {
    return {
      kind: 'learning_path',
      data: {
        id: row.item_id,
        publicId: row.public_id,
        name: row.title,
        description: row.description,
        slug: row.slug,
        coverImage: row.cover_image,
        courseCount: row.course_count,
        certificateId: row.certificate_id,
        earnedAt: row.earned_at,
        certificateAvailable: row.certificate_available
      }
    };
  }

  return {
    kind: 'course',
    data: {
      id: row.item_id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      logo: row.cover_image,
      type: row.course_type,
      earnedAt: row.earned_at,
      certificateAvailable: row.certificate_available,
      validUntil: row.valid_until,
      isExpired: row.is_expired
    }
  };
}

/**
 * One page of every completed course and learning path in an organization,
 * most recently completed first, with the total matching the search. See
 * {@link completedWorkCtes} for what counts as completed. Org membership is
 * the caller's check.
 */
export async function getEarnedCertificates(
  options: GetEarnedCertificatesOptions,
  dbClient: DbOrTxClient = db
): Promise<TEarnedCertificatesPage> {
  try {
    const { limit, page, search } = options;
    const trimmedSearch = search?.trim();
    const matchesSearch = trimmedSearch ? sql`title ILIKE ${toContainsPattern(trimmedSearch)}` : sql`true`;
    const completedWork = completedWorkCtes(options);
    const offset = (page - 1) * limit;

    const [pageRows, totalRows] = await Promise.all([
      dbClient.execute<TCompletedWorkRow>(sql`
        WITH ${completedWork}
        SELECT * FROM completed_work
        WHERE ${matchesSearch}
        ORDER BY earned_at DESC NULLS LAST, kind, item_id
        LIMIT ${limit}
        OFFSET ${offset}
      `),
      dbClient.execute<{ total: number }>(sql`
        WITH ${completedWork}
        SELECT COUNT(*)::int AS total FROM completed_work
        WHERE ${matchesSearch}
      `)
    ]);

    const items = pageRows.map(toEarnedCertificate);
    const total = totalRows[0]?.total ?? 0;

    return { items, total };
  } catch (error) {
    console.error('getEarnedCertificates error:', error);
    throw new Error(
      `Failed to get earned certificates for profile "${options.profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
