import * as schema from '@db/schema';

import { and, eq, inArray, isNotNull, sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import { db } from '@db/drizzle';

export type OrganizationPersonRow = {
  memberId: number;
  profileId: string | null;
  fullname: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  roleId: number;
  status: string;
  verified: boolean;
  joinedAt: string | null;
  lastActiveAt: string | null;
  courseCount: number;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/**
 * Organization members who are not archived, filtered by role and by name, username or email, newest first, with
 * how many of the organization's courses each one belongs to. Invited members without a profile are included.
 */
export async function listOrganizationPeople(options: {
  organizationId: string;
  roleIds: number[];
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ rows: OrganizationPersonRow[]; total: number }> {
  try {
    const searchPattern = options.search ? `%${options.search.replace(/[%_\\]/g, '\\$&')}%` : null;
    const roleIds = sql.join(
      options.roleIds.map((roleId) => sql`${roleId}`),
      sql`, `
    );
    const search: SQL = searchPattern
      ? sql`AND (p.fullname ILIKE ${searchPattern} OR p.username ILIKE ${searchPattern}
          OR COALESCE(p.email, om.email) ILIKE ${searchPattern})`
      : sql``;

    const rows = await db.execute<{
      member_id: number | string;
      profile_id: string | null;
      fullname: string | null;
      username: string | null;
      email: string | null;
      avatar_url: string | null;
      role_id: number | string;
      status: string;
      verified: boolean | null;
      joined_at: string | Date | null;
      last_active_at: string | Date | null;
      course_count: number;
      total_count: number | string;
    }>(sql`
      SELECT om.id AS member_id, om.profile_id, p.fullname, p.username, COALESCE(p.email, om.email) AS email,
        p.avatar_url, om.role_id, om.status, om.verified, om.created_at AS joined_at, om.last_active_at,
        (
          SELECT count(DISTINCT c.id) FROM ${schema.groupmember} gm
          JOIN ${schema.course} c ON c.group_id = gm.group_id
          JOIN ${schema.group} g ON g.id = c.group_id
          WHERE gm.profile_id = om.profile_id AND g.organization_id = om.organization_id
            AND c.status = 'ACTIVE' AND c.is_template = false
        )::int AS course_count,
        count(*) OVER () AS total_count
      FROM ${schema.organizationmember} om
      LEFT JOIN ${schema.profile} p ON p.id = om.profile_id
      WHERE om.organization_id = ${options.organizationId}::uuid
        AND om.status != 'ARCHIVED'
        AND om.role_id IN (${roleIds})
        ${search}
      ORDER BY om.created_at DESC NULLS LAST, om.id DESC
      LIMIT ${options.limit} OFFSET ${options.offset}
    `);

    const total = rows.length > 0 ? Number(rows[0]!.total_count ?? 0) : 0;

    return {
      total,
      rows: rows.map((row) => ({
        memberId: Number(row.member_id),
        profileId: row.profile_id,
        fullname: row.fullname,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatar_url,
        roleId: Number(row.role_id),
        status: row.status,
        verified: row.verified === true,
        joinedAt: toIso(row.joined_at),
        lastActiveAt: toIso(row.last_active_at),
        courseCount: Number(row.course_count ?? 0)
      }))
    };
  } catch (error) {
    console.error('listOrganizationPeople error:', error);
    throw new Error('Failed to list organization people');
  }
}

/** Profile ids of the organization's active, verified admins. */
export async function getOrganizationAdminProfileIds(organizationId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ profileId: schema.organizationmember.profileId })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.roleId, ROLE.ADMIN),
          eq(schema.organizationmember.status, 'ACTIVE'),
          eq(schema.organizationmember.verified, true),
          isNotNull(schema.organizationmember.profileId)
        )
      );

    return [...new Set(rows.map((row) => row.profileId!))];
  } catch (error) {
    console.error('getOrganizationAdminProfileIds error:', error);
    throw new Error('Failed to list organization admins');
  }
}

/** The subset of `profileIds` whose active membership in the organization has the given role. */
export async function filterProfilesByOrganizationRole(
  organizationId: string,
  profileIds: string[],
  roleId: number
): Promise<string[]> {
  const ids = [...new Set(profileIds.filter(Boolean))];
  if (ids.length === 0) return [];

  try {
    const rows = await db
      .select({ profileId: schema.organizationmember.profileId })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.roleId, roleId),
          eq(schema.organizationmember.status, 'ACTIVE'),
          inArray(schema.organizationmember.profileId, ids)
        )
      );

    return [...new Set(rows.map((row) => row.profileId).filter((id): id is string => Boolean(id)))];
  } catch (error) {
    console.error('filterProfilesByOrganizationRole error:', error);
    throw new Error('Failed to filter members by role');
  }
}
