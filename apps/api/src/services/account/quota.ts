import * as schema from '@db/schema';

import { and, count, eq, gte, inArray, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { listAccountOrgIds } from '@cio/db/queries/account';

export type AccountUsage = {
  workspaceCount: number;
  learnerCount: number;
  tokensUsedThisMonth: number;
  perWorkspace: Array<{
    orgId: string;
    learnerCount: number;
    tokensUsedThisMonth: number;
  }>;
};

function startOfCurrentMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getAccountUsage(primaryOrgId: string): Promise<AccountUsage> {
  const orgIds = await listAccountOrgIds(primaryOrgId);
  if (orgIds.length === 0) {
    return { workspaceCount: 0, learnerCount: 0, tokensUsedThisMonth: 0, perWorkspace: [] };
  }

  const since = startOfCurrentMonth().toISOString();

  const [learnerRows, tokenRows] = await Promise.all([
    db
      .select({
        organizationId: schema.organizationmember.organizationId,
        c: count()
      })
      .from(schema.organizationmember)
      .where(
        and(
          inArray(schema.organizationmember.organizationId, orgIds),
          eq(schema.organizationmember.roleId, ROLE.STUDENT)
        )
      )
      .groupBy(schema.organizationmember.organizationId),
    db
      .select({
        orgId: schema.aiTokenUsage.orgId,
        tokens: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`
      })
      .from(schema.aiTokenUsage)
      .where(and(inArray(schema.aiTokenUsage.orgId, orgIds), gte(schema.aiTokenUsage.createdAt, since)))
      .groupBy(schema.aiTokenUsage.orgId)
  ]);

  const learnerByOrg = new Map<string, number>();
  for (const row of learnerRows) {
    learnerByOrg.set(row.organizationId, row.c);
  }

  const tokensByOrg = new Map<string, number>();
  for (const row of tokenRows) {
    if (row.orgId) tokensByOrg.set(row.orgId, Number(row.tokens) || 0);
  }

  const perWorkspace = orgIds.map((orgId) => ({
    orgId,
    learnerCount: learnerByOrg.get(orgId) ?? 0,
    tokensUsedThisMonth: tokensByOrg.get(orgId) ?? 0
  }));

  const learnerCount = perWorkspace.reduce((sum, row) => sum + row.learnerCount, 0);
  const tokensUsedThisMonth = perWorkspace.reduce((sum, row) => sum + row.tokensUsedThisMonth, 0);

  return {
    workspaceCount: orgIds.length,
    learnerCount,
    tokensUsedThisMonth,
    perWorkspace
  };
}
