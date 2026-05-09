import { and, eq, gte, sql } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';

export async function getMonthlyTokenUsage(orgId: string, since: Date): Promise<number> {
  try {
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`
      })
      .from(schema.aiTokenUsage)
      .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, since.toISOString())));

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('getMonthlyTokenUsage error:', error);
    throw new Error('Failed to get monthly token usage');
  }
}

export async function getDailyTokenUsageHistory(
  orgId: string,
  since: Date
): Promise<{ date: string; tokens: number }[]> {
  try {
    const rows = await db
      .select({
        date: sql<string>`DATE(${schema.aiTokenUsage.createdAt})`,
        tokens: sql<number>`SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens}))`
      })
      .from(schema.aiTokenUsage)
      .where(and(eq(schema.aiTokenUsage.orgId, orgId), gte(schema.aiTokenUsage.createdAt, since.toISOString())))
      .groupBy(sql`DATE(${schema.aiTokenUsage.createdAt})`)
      .orderBy(sql`DATE(${schema.aiTokenUsage.createdAt})`);

    return rows.map((row) => ({ date: String(row.date), tokens: Number(row.tokens) }));
  } catch (error) {
    console.error('getDailyTokenUsageHistory error:', error);
    throw new Error('Failed to get daily token usage history');
  }
}

export async function getOrgCreditBalance(orgId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ balance: schema.aiCreditBalance.balance })
      .from(schema.aiCreditBalance)
      .where(eq(schema.aiCreditBalance.orgId, orgId))
      .limit(1);

    return row?.balance ?? 0;
  } catch (error) {
    console.error('getOrgCreditBalance error:', error);
    throw new Error('Failed to get org credit balance');
  }
}

export interface InsertTokenUsageParams {
  orgId: string;
  userId: string;
  courseId: string;
  promptTokens: number;
  completionTokens: number;
  costUnits: number;
  model: string;
  planAllowance: number;
  since: Date;
}

export async function insertTokenUsageAndDrainCredits(params: InsertTokenUsageParams): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.aiTokenUsage).values({
        orgId: params.orgId,
        userId: params.userId,
        courseId: params.courseId,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        costUnits: params.costUnits,
        model: params.model
      });

      const [usageRow] = await tx
        .select({
          total: sql<number>`COALESCE(SUM(COALESCE(${schema.aiTokenUsage.costUnits}, ${schema.aiTokenUsage.promptTokens} + ${schema.aiTokenUsage.completionTokens})), 0)`
        })
        .from(schema.aiTokenUsage)
        .where(
          and(
            eq(schema.aiTokenUsage.orgId, params.orgId),
            gte(schema.aiTokenUsage.createdAt, params.since.toISOString())
          )
        );

      const monthlyUsageAfter = Number(usageRow?.total ?? 0);
      const monthlyUsageBefore = monthlyUsageAfter - params.costUnits;
      const allowanceRemainingBefore = Math.max(0, params.planAllowance - monthlyUsageBefore);
      const overflow = Math.max(0, params.costUnits - allowanceRemainingBefore);

      if (overflow <= 0) {
        return;
      }

      await tx
        .update(schema.aiCreditBalance)
        .set({
          balance: sql`GREATEST(0, ${schema.aiCreditBalance.balance} - ${overflow})`,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.aiCreditBalance.orgId, params.orgId));
    });
  } catch (error) {
    console.error('insertTokenUsageAndDrainCredits error:', error);
    throw new Error('Failed to record token usage');
  }
}

export async function upsertCreditBalance(orgId: string, amount: number): Promise<number> {
  try {
    const existing = await db
      .select({ id: schema.aiCreditBalance.id, balance: schema.aiCreditBalance.balance })
      .from(schema.aiCreditBalance)
      .where(eq(schema.aiCreditBalance.orgId, orgId))
      .limit(1);

    if (existing.length > 0) {
      const newBalance = existing[0].balance + amount;
      await db
        .update(schema.aiCreditBalance)
        .set({ balance: newBalance, updatedAt: new Date().toISOString() })
        .where(eq(schema.aiCreditBalance.orgId, orgId));

      return newBalance;
    }

    await db.insert(schema.aiCreditBalance).values({ orgId, balance: amount });

    return amount;
  } catch (error) {
    console.error('upsertCreditBalance error:', error);
    throw new Error('Failed to upsert credit balance');
  }
}
