import * as schema from '@db/schema';

import type { TNewOrganization, TOrganization } from '@db/types';
import { and, count, eq, inArray, isNull, or } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export async function getAccountPrimary(orgId: string, dbClient: DbOrTxClient = db): Promise<TOrganization | null> {
  try {
    const [row] = await dbClient.select().from(schema.organization).where(eq(schema.organization.id, orgId)).limit(1);

    if (!row) return null;

    if (!row.parentOrganizationId) {
      return row as TOrganization;
    }

    const [parent] = await dbClient
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.id, row.parentOrganizationId))
      .limit(1);

    return (parent ?? null) as TOrganization | null;
  } catch (error) {
    console.error('getAccountPrimary error:', error);
    throw new Error(`Failed to resolve account primary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listWorkspacesForAccount(
  primaryOrgId: string,
  dbClient: DbOrTxClient = db
): Promise<TOrganization[]> {
  try {
    const rows = await dbClient
      .select()
      .from(schema.organization)
      .where(or(eq(schema.organization.id, primaryOrgId), eq(schema.organization.parentOrganizationId, primaryOrgId)));

    return rows as TOrganization[];
  } catch (error) {
    console.error('listWorkspacesForAccount error:', error);
    throw new Error(`Failed to list account workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function countWorkspacesForAccount(primaryOrgId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const [row] = await dbClient
      .select({ count: count() })
      .from(schema.organization)
      .where(or(eq(schema.organization.id, primaryOrgId), eq(schema.organization.parentOrganizationId, primaryOrgId)));

    return row?.count ?? 0;
  } catch (error) {
    console.error('countWorkspacesForAccount error:', error);
    throw new Error(`Failed to count account workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listAccountOrgIds(primaryOrgId: string, dbClient: DbOrTxClient = db): Promise<string[]> {
  const rows = await listWorkspacesForAccount(primaryOrgId, dbClient);
  return rows.map((row) => row.id);
}

export async function getActivePlanForPrimary(
  primaryOrgId: string,
  dbClient: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await dbClient
      .select({ planName: schema.organizationPlan.planName })
      .from(schema.organizationPlan)
      .where(and(eq(schema.organizationPlan.orgId, primaryOrgId), eq(schema.organizationPlan.isActive, true)))
      .limit(1);

    return row?.planName ?? null;
  } catch (error) {
    console.error('getActivePlanForPrimary error:', error);
    throw new Error(`Failed to fetch active plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type CreateSecondaryWorkspaceInput = {
  parentOrganizationId: string;
  name: string;
  siteName: string;
  ownerProfileId: string;
  ownerRoleId: number;
};

export async function createSecondaryWorkspace(input: CreateSecondaryWorkspaceInput): Promise<TOrganization> {
  try {
    return await db.transaction(async (tx) => {
      const insertValues: TNewOrganization = {
        name: input.name,
        siteName: input.siteName,
        parentOrganizationId: input.parentOrganizationId
      } as TNewOrganization;

      const [created] = await tx.insert(schema.organization).values(insertValues).returning();

      if (!created) {
        throw new Error('Insert returned no rows');
      }

      await tx.insert(schema.organizationmember).values({
        organizationId: created.id,
        profileId: input.ownerProfileId,
        roleId: input.ownerRoleId,
        verified: true
      });

      return created as TOrganization;
    });
  } catch (error) {
    console.error('createSecondaryWorkspace error:', error);
    throw new Error(
      `Failed to create secondary workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteSecondaryWorkspace(orgId: string): Promise<{ deleted: boolean; reason?: string }> {
  try {
    const [row] = await db
      .select({
        id: schema.organization.id,
        parentOrganizationId: schema.organization.parentOrganizationId
      })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    if (!row) {
      return { deleted: false, reason: 'NOT_FOUND' };
    }

    if (!row.parentOrganizationId) {
      return { deleted: false, reason: 'IS_PRIMARY' };
    }

    await db.delete(schema.organization).where(eq(schema.organization.id, orgId));
    return { deleted: true };
  } catch (error) {
    console.error('deleteSecondaryWorkspace error:', error);
    throw new Error(`Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function setSecondariesReadOnlyUntil(primaryOrgId: string, until: Date): Promise<number> {
  try {
    const result = await db
      .update(schema.organization)
      .set({ readOnlyUntil: until.toISOString() })
      .where(eq(schema.organization.parentOrganizationId, primaryOrgId))
      .returning({ id: schema.organization.id });

    return result.length;
  } catch (error) {
    console.error('setSecondariesReadOnlyUntil error:', error);
    throw new Error(`Failed to set secondaries read-only: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function clearSecondariesReadOnly(primaryOrgId: string): Promise<number> {
  try {
    const result = await db
      .update(schema.organization)
      .set({ readOnlyUntil: null })
      .where(eq(schema.organization.parentOrganizationId, primaryOrgId))
      .returning({ id: schema.organization.id });

    return result.length;
  } catch (error) {
    console.error('clearSecondariesReadOnly error:', error);
    throw new Error(
      `Failed to clear secondaries read-only: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function findAccountsOverAllowance(
  allowanceByPlan: Record<string, number>
): Promise<Array<{ primaryOrgId: string; planName: string | null; workspaceCount: number }>> {
  try {
    const primaries = await db
      .select({
        id: schema.organization.id,
        planName: schema.organizationPlan.planName
      })
      .from(schema.organization)
      .leftJoin(
        schema.organizationPlan,
        and(eq(schema.organization.id, schema.organizationPlan.orgId), eq(schema.organizationPlan.isActive, true))
      )
      .where(isNull(schema.organization.parentOrganizationId));

    if (primaries.length === 0) return [];

    const childCounts = await db
      .select({
        parentOrganizationId: schema.organization.parentOrganizationId,
        c: count()
      })
      .from(schema.organization)
      .where(
        inArray(
          schema.organization.parentOrganizationId,
          primaries.map((p) => p.id)
        )
      )
      .groupBy(schema.organization.parentOrganizationId);

    const childCountByParent = new Map<string, number>();
    for (const row of childCounts) {
      if (row.parentOrganizationId) childCountByParent.set(row.parentOrganizationId, row.c);
    }

    const offenders: Array<{ primaryOrgId: string; planName: string | null; workspaceCount: number }> = [];
    for (const primary of primaries) {
      const total = 1 + (childCountByParent.get(primary.id) ?? 0);
      const allowance = allowanceByPlan[primary.planName ?? ''] ?? 1;
      if (total > allowance) {
        offenders.push({ primaryOrgId: primary.id, planName: primary.planName, workspaceCount: total });
      }
    }

    return offenders;
  } catch (error) {
    console.error('findAccountsOverAllowance error:', error);
    throw new Error(
      `Failed to find accounts over allowance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
