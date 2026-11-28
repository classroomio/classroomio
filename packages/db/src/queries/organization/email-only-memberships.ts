import { sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export type TEmailOnlyClaimCandidate = {
  organizationId: string;
  memberId: number;
  profileId: string;
  email: string;
};

export type TEmailOnlyMembershipCounts = {
  claimable: { groups: number; cohorts: number; programs: number };
  pending: { groups: number; cohorts: number; programs: number };
};

const EMAIL_ONLY_ROWS = sql`
  SELECT g.organization_id, lower(trim(gm.email)) AS email, 'groups' AS kind
  FROM groupmember gm
  JOIN "group" g ON g.id = gm.group_id
  WHERE gm.profile_id IS NULL AND gm.email IS NOT NULL
  UNION ALL
  SELECT c.organization_id, lower(trim(cm.email)), 'cohorts'
  FROM cohort_member cm
  JOIN cohort c ON c.id = cm.cohort_id
  WHERE cm.profile_id IS NULL AND cm.email IS NOT NULL
  UNION ALL
  SELECT p.organization_id, lower(trim(pm.email)), 'programs'
  FROM program_member pm
  JOIN program p ON p.id = pm.program_id
  WHERE pm.profile_id IS NULL AND pm.email IS NOT NULL
`;

function orgFilter(column: ReturnType<typeof sql.raw>, orgId: string | null) {
  return orgId ? sql`AND ${column} = ${orgId}` : sql``;
}

/**
 * Active joined organization members with a verified email that still have email-only course, cohort or program
 * rows in their own organization, ordered by (organization, member id) and paged by keyset after `after`.
 */
export async function listEmailOnlyClaimCandidates(
  options: { orgId: string | null; after: { organizationId: string; memberId: number } | null; limit: number },
  dbClient: DbOrTxClient = db
): Promise<TEmailOnlyClaimCandidate[]> {
  const afterOrg = options.after?.organizationId ?? '00000000-0000-0000-0000-000000000000';
  const afterId = options.after?.memberId ?? 0;

  try {
    const rows = await dbClient.execute(sql`
      SELECT om.organization_id AS "organizationId", om.id AS "memberId", om.profile_id AS "profileId",
        lower(trim(om.email)) AS email
      FROM organizationmember om
      WHERE om.profile_id IS NOT NULL
        AND om.email IS NOT NULL
        AND om.status = 'ACTIVE'
        AND EXISTS (SELECT 1 FROM profile p WHERE p.id = om.profile_id AND p.is_email_verified = true AND lower(trim(p.email)) = lower(trim(om.email)))
        AND (om.organization_id, om.id) > (${afterOrg}::uuid, ${afterId}::bigint)
        ${orgFilter(sql.raw('om.organization_id'), options.orgId)}
        AND EXISTS (
          SELECT 1 FROM (${EMAIL_ONLY_ROWS}) AS email_only
          WHERE email_only.organization_id = om.organization_id
            AND email_only.email = lower(trim(om.email))
        )
      ORDER BY om.organization_id, om.id
      LIMIT ${options.limit}
    `);

    return rows.map((row) => {
      const candidate = row as unknown as TEmailOnlyClaimCandidate;

      return { ...candidate, memberId: Number(candidate.memberId) };
    });
  } catch (error) {
    console.error('listEmailOnlyClaimCandidates error:', error);
    throw new Error(
      `Failed to list email-only claim candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Locks a claim candidate's organization member row and reports whether it is still the same active joined member
 * (same profile and email, email still verified). Call it inside the claim's transaction so an archival that commits first is seen and one
 * that starts later waits for the claim.
 */
export async function lockActiveEmailOnlyClaimCandidate(
  candidate: TEmailOnlyClaimCandidate,
  dbClient: DbOrTxClient
): Promise<boolean> {
  try {
    const rows = await dbClient.execute(sql`
      SELECT om.id
      FROM organizationmember om
      WHERE om.id = ${candidate.memberId}
        AND om.organization_id = ${candidate.organizationId}
        AND om.profile_id = ${candidate.profileId}
        AND om.status = 'ACTIVE'
        AND lower(trim(om.email)) = ${candidate.email}
        AND EXISTS (SELECT 1 FROM profile p WHERE p.id = om.profile_id AND p.is_email_verified = true AND lower(trim(p.email)) = lower(trim(om.email)))
      FOR UPDATE OF om
    `);

    return rows.length > 0;
  } catch (error) {
    console.error('lockActiveEmailOnlyClaimCandidate error:', error);
    throw new Error(
      `Failed to lock the email-only claim candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Email-only course, cohort and program rows, split into claimable (an active joined member with a verified email
 * has that email in the same organization) and pending (nobody with that verified email has joined yet).
 */
export async function countEmailOnlyMemberships(
  orgId: string | null,
  dbClient: DbOrTxClient = db
): Promise<TEmailOnlyMembershipCounts> {
  try {
    const rows = await dbClient.execute(sql`
      SELECT email_only.kind,
        count(*) FILTER (WHERE joined.id IS NOT NULL)::int AS claimable,
        count(*) FILTER (WHERE joined.id IS NULL)::int AS pending
      FROM (${EMAIL_ONLY_ROWS}) AS email_only
      LEFT JOIN LATERAL (
        SELECT om.id
        FROM organizationmember om
        WHERE om.organization_id = email_only.organization_id
          AND lower(trim(om.email)) = email_only.email
          AND om.profile_id IS NOT NULL
          AND om.status = 'ACTIVE'
          AND EXISTS (SELECT 1 FROM profile p WHERE p.id = om.profile_id AND p.is_email_verified = true AND lower(trim(p.email)) = lower(trim(om.email)))
        LIMIT 1
      ) AS joined ON true
      WHERE true ${orgFilter(sql.raw('email_only.organization_id'), orgId)}
      GROUP BY email_only.kind
    `);

    const counts: TEmailOnlyMembershipCounts = {
      claimable: { groups: 0, cohorts: 0, programs: 0 },
      pending: { groups: 0, cohorts: 0, programs: 0 }
    };
    for (const row of rows as unknown as {
      kind: 'groups' | 'cohorts' | 'programs';
      claimable: number;
      pending: number;
    }[]) {
      counts.claimable[row.kind] = Number(row.claimable);
      counts.pending[row.kind] = Number(row.pending);
    }

    return counts;
  } catch (error) {
    console.error('countEmailOnlyMemberships error:', error);
    throw new Error(
      `Failed to count email-only memberships: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
