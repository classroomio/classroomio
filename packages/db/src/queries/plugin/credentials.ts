import * as schema from '@db/schema';
import type { TNewPluginBackendClient, TNewPluginCredential, TPluginBackendClient, TPluginCredential } from '@db/types';
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

export async function revokePluginCredential(
  installationId: string,
  credentialId: string
): Promise<TPluginCredential | null> {
  const [row] = await db
    .update(schema.pluginCredential)
    .set({
      revokedAt: new Date().toISOString()
    })
    .where(
      and(eq(schema.pluginCredential.id, credentialId), eq(schema.pluginCredential.installationId, installationId))
    )
    .returning();

  return row ?? null;
}

export async function revokeInstallationCredentials(installationId: string): Promise<void> {
  await db
    .update(schema.pluginCredential)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(schema.pluginCredential.installationId, installationId), isNull(schema.pluginCredential.revokedAt)));
}

export async function createPluginBackendClient(data: TNewPluginBackendClient): Promise<TPluginBackendClient> {
  const [row] = await db.insert(schema.pluginBackendClient).values(data).returning();

  return row;
}

export async function getActiveBackendClientByHash(secretHash: string): Promise<TPluginBackendClient | null> {
  const [row] = await db
    .select()
    .from(schema.pluginBackendClient)
    .where(
      and(
        eq(schema.pluginBackendClient.secretHash, secretHash),
        eq(schema.pluginBackendClient.status, 'active'),
        isNull(schema.pluginBackendClient.revokedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getActiveBackendClientByClientId(clientId: string): Promise<TPluginBackendClient | null> {
  const [row] = await db
    .select()
    .from(schema.pluginBackendClient)
    .where(
      and(
        eq(schema.pluginBackendClient.clientId, clientId),
        eq(schema.pluginBackendClient.status, 'active'),
        isNull(schema.pluginBackendClient.revokedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function revokePluginBackendClient(id: string): Promise<TPluginBackendClient | null> {
  const [row] = await db
    .update(schema.pluginBackendClient)
    .set({
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.pluginBackendClient.id, id))
    .returning();

  return row ?? null;
}

export async function rotatePluginBackendClient(
  id: string,
  secretPrefix: string,
  secretHash: string
): Promise<TPluginBackendClient | null> {
  const [row] = await db
    .update(schema.pluginBackendClient)
    .set({
      secretPrefix,
      secretHash,
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.pluginBackendClient.id, id))
    .returning();

  return row ?? null;
}
