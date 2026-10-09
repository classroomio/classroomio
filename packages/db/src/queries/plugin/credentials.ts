import * as schema from '@db/schema';
import type { TNewPluginCredential, TPluginCredential } from '@db/types';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@db/drizzle';

export async function createPluginCredential(data: TNewPluginCredential): Promise<TPluginCredential> {
  const [row] = await db.insert(schema.pluginCredential).values(data).returning();

  return row;
}

export async function getActiveCredentialByHash(secretHash: string): Promise<TPluginCredential | null> {
  const [row] = await db
    .select()
    .from(schema.pluginCredential)
    .where(and(eq(schema.pluginCredential.secretHash, secretHash), isNull(schema.pluginCredential.revokedAt)))
    .limit(1);

  return row ?? null;
}

export async function listInstallationCredentials(installationId: string): Promise<TPluginCredential[]> {
  return db.select().from(schema.pluginCredential).where(eq(schema.pluginCredential.installationId, installationId));
}

export async function revokePluginCredential(credentialId: string): Promise<TPluginCredential | null> {
  const [row] = await db
    .update(schema.pluginCredential)
    .set({
      revokedAt: new Date().toISOString()
    })
    .where(eq(schema.pluginCredential.id, credentialId))
    .returning();

  return row ?? null;
}
