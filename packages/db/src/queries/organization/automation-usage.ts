import * as schema from '@db/schema';

import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';
import type { TAutomationUsageCategory, TNewOrganizationAutomationUsage, TOrganizationApiKeyType } from '@db/types';

export const createOrganizationAutomationUsage = async (data: TNewOrganizationAutomationUsage) => {
  try {
    const [row] = await db.insert(schema.organizationAutomationUsage).values(data).returning();

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
  since: string
): Promise<number> => {
  try {
    const [row] = await db
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
  since: string
): Promise<number> => {
  try {
    const [row] = await db
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
