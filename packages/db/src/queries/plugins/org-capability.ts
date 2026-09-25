import * as schema from '@db/schema';
import { db, eq, type DbOrTxClient } from '@db/drizzle';
import type { TOrgCapability } from '@db/types';

export async function getOrgCapabilities(orgId: string, txClient: DbOrTxClient = db): Promise<TOrgCapability[]> {
  if (!orgId) {
    throw new Error('orgId is required to fetch org capabilities');
  }

  return txClient.select().from(schema.orgCapability).where(eq(schema.orgCapability.orgId, orgId));
}

export async function upsertOrgCapability(
  orgId: string,
  capabilityId: string,
  isEnabled: boolean,
  txClient: DbOrTxClient = db
): Promise<TOrgCapability> {
  if (!orgId || !capabilityId) {
    throw new Error('orgId and capabilityId are required to update an org capability');
  }

  const updatedAt = new Date().toISOString();
  const [record] = await txClient
    .insert(schema.orgCapability)
    .values({ orgId, capabilityId, isEnabled, updatedAt })
    .onConflictDoUpdate({
      target: [schema.orgCapability.orgId, schema.orgCapability.capabilityId],
      set: { isEnabled, updatedAt }
    })
    .returning();

  return record;
}
