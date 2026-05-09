import { and, desc, eq, gte, sql } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export interface UsageLeaderboardRow {
  userId: string;
  fullname: string | null;
  email: string | null;
  avatarUrl: string | null;
  tokens: number;
  favoriteModel: string | null;
  requests: number;
}

/**
 * Aggregate ai_token_usage by user for an org since a given date.
 * Joins to profile for display fields. Returns rows sorted by tokens DESC.
 */
export async function aggregateTokenUsageByUser(orgId: string, since: Date): Promise<UsageLeaderboardRow[]> {
  try {
    const rows = await db
      .select({
        userId: schema.aiTokenUsage.userId,
        fullname: schema.profile.fullname,
        email: schema.profile.email,
        avatarUrl: schema.profile.avatarUrl,
        tokens: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`,
        favoriteModel: sql<string | null>`MODE() WITHIN GROUP (ORDER BY ${schema.aiTokenUsage.model})`,
        requests: sql<number>`COUNT(*)`
      })
      .from(schema.aiTokenUsage)
      .leftJoin(schema.profile, eq(schema.profile.id, schema.aiTokenUsage.userId))
      .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, since.toISOString())))
      .groupBy(schema.aiTokenUsage.userId, schema.profile.fullname, schema.profile.email, schema.profile.avatarUrl)
      .orderBy(
        desc(
          sql`SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens}))`
        )
      );

    return rows.map((row) => ({
      ...row,
      tokens: Number(row.tokens),
      requests: Number(row.requests)
    }));
  } catch (error) {
    console.error('aggregateTokenUsageByUser error:', error);
    throw new Error('Failed to aggregate token usage by user');
  }
}

/**
 * Total request count for an org since a given date — used for the chart header.
 */
export async function countRequests(orgId: string, since: Date): Promise<number> {
  try {
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.aiTokenUsage)
      .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, since.toISOString())));

    return Number(row?.count ?? 0);
  } catch (error) {
    console.error('countRequests error:', error);
    throw new Error('Failed to count requests');
  }
}
