import * as schema from '@db/schema';

import { sql } from 'drizzle-orm';

/**
 * Mirrors `deriveAudienceMemberStatus` so invite status can be filtered before
 * `LIMIT`. That function still owns the value returned to clients — keep both
 * in step.
 */
export const inviteStatusSql = sql<string>`(
  CASE
    WHEN ${schema.organizationmember.profileId} IS NOT NULL THEN 'active'
    ELSE COALESCE((
      SELECT CASE
               WHEN oi.accepted_at IS NOT NULL THEN 'active'
               WHEN oi.is_revoked THEN 'revoked'
               WHEN oi.expires_at <= now() THEN 'expired'
               ELSE 'pending'
             END
      FROM organization_invite oi
      WHERE oi.organization_id = ${schema.organizationmember.organizationId}
        AND lower(oi.email) = lower(${schema.organizationmember.email})
      ORDER BY oi.created_at DESC
      LIMIT 1
    ), 'pending')
  END
)`;

/** False for a member who never joined and whose latest invite was revoked or has expired. */
export const inviteHoldsSeatSql = sql<boolean>`${inviteStatusSql} NOT IN ('revoked', 'expired')`;
