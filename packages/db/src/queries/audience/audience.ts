import * as schema from '@db/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@db/drizzle';

export interface TSearchOrgAudienceMember {
  memberId: number;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export async function searchOrgAudience(
  orgId: string,
  search: string,
  limit: number
): Promise<TSearchOrgAudienceMember[]> {
  try {
    const searchValue = `%${search.trim()}%`;
    const audienceNameSql = sql<string>`COALESCE(NULLIF(${schema.profile.fullname}, ''), ${schema.profile.email}, ${schema.organizationmember.email})`;
    const audienceEmailSql = sql<string>`COALESCE(${schema.profile.email}, ${schema.organizationmember.email})`;
    const audienceCreatedAtSql = sql<string>`COALESCE(${schema.profile.createdAt}, ${schema.organizationmember.createdAt})`;

    const rows = await db
      .select({
        memberId: schema.organizationmember.id,
        profileId: schema.profile.id,
        name: audienceNameSql.as('name'),
        email: audienceEmailSql.as('email'),
        avatarUrl: schema.profile.avatarUrl,
        createdAt: audienceCreatedAtSql.as('createdAt')
      })
      .from(schema.organizationmember)
      .leftJoin(schema.profile, eq(schema.organizationmember.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.organizationmember.organizationId, orgId),
          eq(schema.organizationmember.roleId, ROLE.STUDENT),
          or(
            ilike(schema.profile.fullname, searchValue),
            ilike(schema.profile.email, searchValue),
            ilike(schema.organizationmember.email, searchValue)
          )
        )
      )
      .orderBy(desc(audienceCreatedAtSql), desc(schema.organizationmember.id))
      .limit(limit);

    return rows.map((row) => {
      const email = row.email?.trim() ?? '';
      const name = row.name?.trim() || (email.includes('@') ? email.split('@')[0] : email) || '';

      return {
        ...row,
        name,
        email
      };
    });
  } catch (error) {
    console.error('searchOrgAudience error:', error);
    throw new Error(`Failed to search org audience: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
