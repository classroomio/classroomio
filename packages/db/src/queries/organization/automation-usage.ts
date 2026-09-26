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

/**
 * Counts and reserves one usage slot in a single transaction, under an advisory lock per
 * organization + key type + category, so concurrent requests can't all pass the limit check
 * before any of them is recorded. Returns the reserved row id, or null when a limit is reached.
 */
export const reserveOrganizationAutomationUsage = async (input: {
  organizationId: string;
  organizationApiKeyId: string;
  type: TOrganizationApiKeyType;
  category: TAutomationUsageCategory;
  action: string;
  since: string;
  keyLimit: number;
  orgLimit: number;
}): Promise<string | null> => {
  const { organizationId, organizationApiKeyId, type, category, action, since, keyLimit, orgLimit } = input;

  try {
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`automation_usage:${organizationId}:${type}:${category}`}))`
      );

      const inWindow = and(
        eq(schema.organizationAutomationUsage.type, type),
        eq(schema.organizationAutomationUsage.category, category),
        gte(schema.organizationAutomationUsage.createdAt, since)
      );
      const [[keyRow], [orgRow]] = await Promise.all([
        tx
          .select({ total: count() })
          .from(schema.organizationAutomationUsage)
          .where(and(eq(schema.organizationAutomationUsage.organizationApiKeyId, organizationApiKeyId), inWindow)),
        tx
          .select({ total: count() })
          .from(schema.organizationAutomationUsage)
          .where(and(eq(schema.organizationAutomationUsage.organizationId, organizationId), inWindow))
      ]);

      if (Number(keyRow?.total ?? 0) >= keyLimit || Number(orgRow?.total ?? 0) >= orgLimit) {
        return null;
      }

      const [row] = await tx
        .insert(schema.organizationAutomationUsage)
        .values({ organizationId, organizationApiKeyId, type, action, category, creditsConsumed: 0 })
        .returning({ id: schema.organizationAutomationUsage.id });

      if (!row) {
        throw new Error('Failed to reserve organization automation usage');
      }

      return row.id;
    });
  } catch (error) {
    console.error('reserveOrganizationAutomationUsage error:', error);
    throw new Error('Failed to reserve organization automation usage');
  }
};

export const completeOrganizationAutomationUsage = async (
  id: string,
  data: { action: string; creditsConsumed: number; metadata?: Record<string, unknown> }
) => {
  try {
    await db
      .update(schema.organizationAutomationUsage)
      .set({ action: data.action, creditsConsumed: data.creditsConsumed, metadata: data.metadata ?? {} })
      .where(eq(schema.organizationAutomationUsage.id, id));
  } catch (error) {
    console.error('completeOrganizationAutomationUsage error:', error);
    throw new Error('Failed to complete organization automation usage');
  }
};

export const releaseOrganizationAutomationUsage = async (id: string) => {
  try {
    await db.delete(schema.organizationAutomationUsage).where(eq(schema.organizationAutomationUsage.id, id));
  } catch (error) {
    console.error('releaseOrganizationAutomationUsage error:', error);
    throw new Error('Failed to release organization automation usage');
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
