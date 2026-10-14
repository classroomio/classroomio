import * as schema from '@db/schema';

import { sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import { toContainsPattern } from '@db/utils/like-pattern';

export interface TEarnedCourseCertificate {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  logo: string;
  type: string;
  earnedAt: string;
}

export interface TEarnedPathCertificate {
  id: string;
  publicId: string;
  name: string;
  description: string;
  slug: string | null;
  coverImage: string | null;
  courseCount: number;
  certificateId: string;
  earnedAt: string;
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
  /** Case-insensitive match on course titles and path names. */
  search?: string;
}

type TEarnedCertificateRow = {
  total: number;
  kind: 'course' | 'learning_path' | null;
  item_id: string | null;
  title: string | null;
  description: string | null;
  slug: string | null;
  cover_image: string | null;
  course_type: string | null;
  public_id: string | null;
  course_count: number | null;
  certificate_id: string | null;
  earned_at: string | null;
};

/**
 * One page of the certificates a learner can download in an organization,
 * newest first, in a single statement: course certificates earned on their
 * enrollment (including courses taken inside a path) and issued path
 * certificates, only while the learner is an active member of the
 * organization. Each row passes the same checks as its download route, except
 * the org plan, which the caller checks once for the whole list. Totals come
 * from a one-row CTE the page is left-joined onto, so a page past the end
 * still reports them.
 */
export async function getEarnedCertificates(
  { orgId, profileId, limit, page, search }: GetEarnedCertificatesOptions,
  dbClient: DbOrTxClient = db
): Promise<TEarnedCertificatesPage> {
  try {
    const trimmedSearch = search?.trim();
    const matchesSearch = trimmedSearch ? sql`ec.title ILIKE ${toContainsPattern(trimmedSearch)}` : sql`true`;

    const rows = await dbClient.execute<TEarnedCertificateRow>(sql`
      WITH earned_certificates AS (
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
          gm.certificate_earned_at AS earned_at
        FROM ${schema.groupmember} gm
        JOIN ${schema.course} c ON c.group_id = gm.group_id AND c.status = 'ACTIVE'
        JOIN ${schema.group} g ON g.id = c.group_id AND g.organization_id = ${orgId}
        WHERE gm.profile_id = ${profileId}
          AND gm.certificate_earned_at IS NOT NULL
          AND c.certificate->>'isDownloadable' = 'true'
          AND EXISTS (
            SELECT 1 FROM ${schema.courseEnrollmentGrant} ceg
            WHERE ceg.course_id = c.id AND ceg.profile_id = ${profileId} AND ceg.revoked_at IS NULL
          )
        UNION ALL
        SELECT 'learning_path',
          lp.id,
          lp.name,
          lp.description,
          lp.slug,
          lp.cover_image,
          NULL,
          lp.public_id,
          (
            SELECT COUNT(*)::int
            FROM ${schema.learningPathCourse} lpc
            JOIN ${schema.course} pc ON pc.id = lpc.course_id AND pc.status = 'ACTIVE'
            WHERE lpc.learning_path_id = lp.id AND lpc.removed_at IS NULL
          ),
          ci.certificate_id,
          ci.issued_at
        FROM ${schema.learningPathCertificateIssue} ci
        JOIN ${schema.learningPath} lp ON lp.id = ci.learning_path_id
        JOIN ${schema.learningPathMember} lpm ON lpm.id = ci.learning_path_member_id
        WHERE ci.profile_id = ${profileId}
          AND ci.status = 'valid'
          AND ci.revoked_at IS NULL
          AND lp.organization_id = ${orgId}
          AND lp.status = 'ACTIVE'
          AND lp.certificate->>'isDownloadable' = 'true'
          AND lpm.removed_at IS NULL
          AND lpm.status = 'COMPLETED'
      ),
      matching_certificates AS (
        SELECT ec.* FROM earned_certificates ec
        WHERE ${matchesSearch}
          AND EXISTS (
            SELECT 1 FROM ${schema.organizationmember} om
            WHERE om.organization_id = ${orgId} AND om.profile_id = ${profileId} AND om.status = 'ACTIVE'
          )
      ),
      certificate_totals AS (
        SELECT COUNT(*)::int AS total FROM matching_certificates
      ),
      certificate_page AS (
        SELECT * FROM matching_certificates
        ORDER BY earned_at DESC, kind, item_id
        LIMIT ${limit}
        OFFSET ${(page - 1) * limit}
      )
      SELECT ct.total, cp.*
      FROM certificate_totals ct
      LEFT JOIN certificate_page cp ON true
      ORDER BY cp.earned_at DESC, cp.kind, cp.item_id
    `);

    const items = rows.flatMap((row): TEarnedCertificate[] => {
      if (!row.item_id || !row.earned_at) return [];

      if (row.kind === 'course') {
        return [
          {
            kind: 'course',
            data: {
              id: row.item_id,
              title: row.title ?? '',
              description: row.description ?? '',
              slug: row.slug,
              logo: row.cover_image ?? '',
              type: row.course_type ?? '',
              earnedAt: row.earned_at
            }
          }
        ];
      }

      if (row.kind === 'learning_path' && row.public_id && row.certificate_id) {
        return [
          {
            kind: 'learning_path',
            data: {
              id: row.item_id,
              publicId: row.public_id,
              name: row.title ?? '',
              description: row.description ?? '',
              slug: row.slug,
              coverImage: row.cover_image,
              courseCount: row.course_count ?? 0,
              certificateId: row.certificate_id,
              earnedAt: row.earned_at
            }
          }
        ];
      }

      return [];
    });

    const [totals] = rows;

    return { items, total: totals?.total ?? 0 };
  } catch (error) {
    console.error('getEarnedCertificates error:', error);
    throw new Error(
      `Failed to get earned certificates for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
