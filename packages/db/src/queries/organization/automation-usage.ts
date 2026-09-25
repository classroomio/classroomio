import * as schema from '@db/schema';

import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TAutomationUsageCategory, TNewOrganizationAutomationUsage, TOrganizationApiKeyType } from '@db/types';

/**
 * Transaction-scoped lock serializing usage checks and inserts for one organization and key type.
 * Released automatically when the transaction ends.
 */
export const lockOrganizationAutomationUsage = async (
  organizationId: string,
  type: TOrganizationApiKeyType,
  dbClient: DbOrTxClient
) => {
  try {
    await dbClient.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`automation_usage:${organizationId}:${type}`}))`
    );
  } catch (error) {
    console.error('lockOrganizationAutomationUsage error:', error);
    throw new Error('Failed to lock organization automation usage');
  }
};

export const createOrganizationAutomationUsage = async (
  data: TNewOrganizationAutomationUsage,
  dbClient: DbOrTxClient = db
) => {
  try {
    const [row] = await dbClient.insert(schema.organizationAutomationUsage).values(data).returning();

    if (!row) {
      throw new Error('Failed to create organization automation usage');
    }

    return row;
  } catch (error) {
    console.error('createOrganizationAutomationUsage error:', error);
    throw new Error('Failed to create organization automation usage');
  }
};

export const countOrganizationAutomationUsageSinceByKey = async (
  organizationApiKeyId: string,
  category: TAutomationUsageCategory,
  since: string,
  dbClient: DbOrTxClient = db
): Promise<number> => {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.organizationAutomationUsage)
      .where(
        and(
          eq(schema.organizationAutomationUsage.organizationApiKeyId, organizationApiKeyId),
          eq(schema.organizationAutomationUsage.category, category),
          gte(schema.organizationAutomationUsage.createdAt, since)
        )
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countOrganizationAutomationUsageSinceByKey error:', error);
    throw new Error('Failed to count organization automation usage by key');
  }
};

export const countOrganizationAutomationUsageSince = async (
  organizationId: string,
  type: TOrganizationApiKeyType,
  category: TAutomationUsageCategory,
  since: string,
  dbClient: DbOrTxClient = db
): Promise<number> => {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.organizationAutomationUsage)
      .where(
        and(
          eq(schema.organizationAutomationUsage.organizationId, organizationId),
          eq(schema.organizationAutomationUsage.type, type),
          eq(schema.organizationAutomationUsage.category, category),
          gte(schema.organizationAutomationUsage.createdAt, since)
        )
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countOrganizationAutomationUsageSince error:', error);
    throw new Error('Failed to count organization automation usage');
  }
};

export const deleteOrganizationAutomationUsage = async (usageId: string) => {
  try {
    await db.delete(schema.organizationAutomationUsage).where(eq(schema.organizationAutomationUsage.id, usageId));
  } catch (error) {
    console.error('deleteOrganizationAutomationUsage error:', error);
    throw new Error('Failed to delete organization automation usage');
  }
};

export const getOrganizationAutomationCreditsUsedSince = async (
  organizationId: string,
  type: TOrganizationApiKeyType,
  since: string
): Promise<number> => {
  try {
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.organizationAutomationUsage.creditsConsumed}), 0)`
      })
      .from(schema.organizationAutomationUsage)
      .where(
        and(
          eq(schema.organizationAutomationUsage.organizationId, organizationId),
          eq(schema.organizationAutomationUsage.type, type),
          gte(schema.organizationAutomationUsage.createdAt, since)
        )
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('getOrganizationAutomationCreditsUsedSince error:', error);
    throw new Error('Failed to get organization automation credits used');
  }
};

export const listRecentOrganizationAutomationUsage = async (
  organizationId: string,
  type: TOrganizationApiKeyType,
  limit = 10
) => {
  try {
    return await db
      .select({
        action: schema.organizationAutomationUsage.action,
        creditsConsumed: schema.organizationAutomationUsage.creditsConsumed,
        createdAt: schema.organizationAutomationUsage.createdAt
      })
      .from(schema.organizationAutomationUsage)
      .where(
        and(
          eq(schema.organizationAutomationUsage.organizationId, organizationId),
          eq(schema.organizationAutomationUsage.type, type)
        )
      )
      .orderBy(desc(schema.organizationAutomationUsage.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('listRecentOrganizationAutomationUsage error:', error);
    throw new Error('Failed to list recent organization automation usage');
  }
};
