import * as schema from '@db/schema';

import { and, count, eq, inArray, ne, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { type DbOrTxClient, db } from '@db/drizzle';

export type OrganizationMemberStatus = 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED';
export type OrganizationMemberAuditEvent = 'DEACTIVATED' | 'REACTIVATED' | 'ARCHIVED' | 'UNARCHIVED' | 'REMOVED';

export type BulkAudienceMemberRow = {
  id: number;
  profileId: string | null;
  email: string | null;
  status: OrganizationMemberStatus;
};

/**
 * Rows a bulk action may touch. Authorization lives here, not in the caller:
 * an id from another org, or an admin's, simply does not come back.
 */
export async function getBulkAudienceMembersByIds(
  orgId: string,
  memberIds: number[],
  dbClient: DbOrTxClient = db
): Promise<BulkAudienceMemberRow[]> {
  if (memberIds.length === 0) {
    return [];
  }

  try {
    const rows = await dbClient
      .select({
        id: schema.organizationmember.id,
        profileId: schema.organizationmember.profileId,
        email: schema.organizationmember.email,
        status: schema.organizationmember.status
      })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          inArray(schema.organizationmember.id, memberIds)
        )
      );

    return rows;
  } catch (error) {
    console.error('getBulkAudienceMembersByIds error:', error);
    throw new Error('Failed to resolve audience members for bulk action');
  }
}

/** Bounded by `LIMIT`, not by slicing a fully-loaded array. */
export async function getBulkAudienceMemberSample(
  orgId: string,
  memberIds: number[],
  sampleSize: number,
  dbClient: DbOrTxClient = db
): Promise<BulkAudienceMemberRow[]> {
  if (memberIds.length === 0) {
    return [];
  }

  try {
    return await dbClient
      .select({
        id: schema.organizationmember.id,
        profileId: schema.organizationmember.profileId,
        email: schema.organizationmember.email,
        status: schema.organizationmember.status
      })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          inArray(schema.organizationmember.id, memberIds.slice(0, sampleSize))
        )
      )
      .orderBy(schema.organizationmember.id)
      .limit(sampleSize);
  } catch (error) {
    console.error('getBulkAudienceMemberSample error:', error);
    throw new Error('Failed to sample audience members');
  }
}

/** The delete gate, as an aggregate rather than a loaded array. */
export async function countBulkAudienceMembersNotArchived(
  orgId: string,
  memberIds: number[],
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (memberIds.length === 0) {
    return 0;
  }

  try {
    const [row] = await dbClient
      .select({ count: count(schema.organizationmember.id) })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          inArray(schema.organizationmember.id, memberIds),
          ne(schema.organizationmember.status, 'ARCHIVED')
        )
      );

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countBulkAudienceMembersNotArchived error:', error);
    throw new Error('Failed to count non-archived audience members');
  }
}

/**
 * Applies a status and returns the rows that actually changed. Rows already in
 * the target status are excluded, so re-running writes no misleading audit.
 */
export async function bulkUpdateOrganizationMemberStatus(
  orgId: string,
  memberIds: number[],
  status: OrganizationMemberStatus,
  actorProfileId: string,
  dbClient: DbOrTxClient = db
): Promise<number[]> {
  if (memberIds.length === 0) {
    return [];
  }

  try {
    const updated = await dbClient
      .update(schema.organizationmember)
      .set({ status, statusChangedAt: new Date().toISOString(), statusChangedBy: actorProfileId })
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          inArray(schema.organizationmember.id, memberIds),
          ne(schema.organizationmember.status, status)
        )
      )
      .returning({ id: schema.organizationmember.id });

    return updated.map((row) => row.id);
  } catch (error) {
    console.error('bulkUpdateOrganizationMemberStatus error:', error);
    throw new Error('Failed to update organization member status');
  }
}

/** Enrolments are cleared by the caller in the same transaction. */
export async function bulkDeleteOrganizationAudienceMembers(
  orgId: string,
  memberIds: number[],
  dbClient: DbOrTxClient = db
): Promise<number[]> {
  if (memberIds.length === 0) {
    return [];
  }

  try {
    const deleted = await dbClient
      .delete(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          inArray(schema.organizationmember.id, memberIds)
        )
      )
      .returning({ id: schema.organizationmember.id });

    return deleted.map((row) => row.id);
  } catch (error) {
    console.error('bulkDeleteOrganizationAudienceMembers error:', error);
    throw new Error('Failed to delete organization audience members');
  }
}

export type MemberAuditEntry = {
  memberId: number;
  profileId: string | null;
  targetEmail: string | null;
  eventType: OrganizationMemberAuditEvent;
  actorProfileId: string;
  reason?: string;
  /** The filter the action was launched from, so a bulk change stays replayable. */
  filterSnapshot?: Record<string, unknown>;
};

export async function recordOrganizationMemberAudit(
  orgId: string,
  entries: MemberAuditEntry[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  try {
    await dbClient.insert(schema.organizationMemberAudit).values(
      entries.map((entry) => ({
        organizationId: orgId,
        memberId: entry.memberId,
        profileId: entry.profileId,
        targetEmail: entry.targetEmail,
        eventType: entry.eventType,
        actorProfileId: entry.actorProfileId,
        reason: entry.reason ?? null,
        filterSnapshot: entry.filterSnapshot ?? {}
      }))
    );
  } catch (error) {
    console.error('recordOrganizationMemberAudit error:', error);
    throw new Error('Failed to record organization member audit entries');
  }
}

/**
 * Recomputes `last_active_at` from page events and lesson completions, which
 * ingest alone misses — completions never flow through page events.
 *
 * Only moves timestamps forward, so re-running is always safe.
 */
export async function reconcileMemberLastActive(lookbackDays: number, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const result = await dbClient.execute(sql`
      WITH page_activity AS (
        SELECT ${schema.analyticsPageEvent.orgId} AS org_id,
               ${schema.analyticsPageEvent.userId} AS user_id,
               MAX(${schema.analyticsPageEvent.occurredAt}) AS last_at
        FROM ${schema.analyticsPageEvent}
        WHERE ${schema.analyticsPageEvent.orgId} IS NOT NULL
          AND ${schema.analyticsPageEvent.userId} IS NOT NULL
          AND ${schema.analyticsPageEvent.occurredAt} >= now() - make_interval(days => ${lookbackDays})
        GROUP BY 1, 2
      ),
      lesson_activity AS (
        SELECT g.organization_id AS org_id,
               lc.profile_id AS user_id,
               MAX(lc.updated_at) AS last_at
        FROM lesson_completion lc
        JOIN lesson l ON l.id = lc.lesson_id
        JOIN course c ON c.id = l.course_id
        JOIN "group" g ON g.id = c.group_id
        WHERE lc.profile_id IS NOT NULL
          AND g.organization_id IS NOT NULL
          AND lc.updated_at IS NOT NULL
          AND lc.updated_at >= now() - make_interval(days => ${lookbackDays})
        GROUP BY 1, 2
      ),
      combined AS (
        SELECT org_id, user_id, MAX(last_at) AS last_at
        FROM (SELECT * FROM page_activity UNION ALL SELECT * FROM lesson_activity) signals
        GROUP BY 1, 2
      )
      UPDATE organizationmember om
      SET last_active_at = GREATEST(om.last_active_at, combined.last_at)
      FROM combined
      WHERE om.organization_id = combined.org_id
        AND om.profile_id = combined.user_id
        AND (om.last_active_at IS NULL OR om.last_active_at < combined.last_at)
      RETURNING om.id
    `);

    return result.length;
  } catch (error) {
    console.error('reconcileMemberLastActive error:', error);
    throw new Error('Failed to reconcile member last active timestamps');
  }
}
