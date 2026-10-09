import * as schema from '@db/schema';
import type { TPluginGrant } from '@db/types';
import { and, eq } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function getInstallationGrants(installationId: string): Promise<TPluginGrant[]> {
  return db.select().from(schema.pluginGrant).where(eq(schema.pluginGrant.installationId, installationId));
}

export async function hasInstallationScope(installationId: string, scope: string): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.pluginGrant.id })
    .from(schema.pluginGrant)
    .where(and(eq(schema.pluginGrant.installationId, installationId), eq(schema.pluginGrant.scope, scope)))
    .limit(1);

  return Boolean(row);
}

export async function replaceInstallationGrants(
  installationId: string,
  scopes: string[],
  grantedByProfileId?: string
): Promise<TPluginGrant[]> {
  return db.transaction(async (tx) => {
    // Delete existing grants
    await tx.delete(schema.pluginGrant).where(eq(schema.pluginGrant.installationId, installationId));

    if (scopes.length === 0) {
      return [];
    }

    const newGrants = scopes.map((scope) => ({
      installationId,
      scope,
      grantedByProfileId
    }));

    return tx.insert(schema.pluginGrant).values(newGrants).returning();
  });
}
