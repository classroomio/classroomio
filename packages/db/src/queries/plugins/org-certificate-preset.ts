import * as schema from '@db/schema';
import { and, db, eq, type DbOrTxClient } from '@db/drizzle';
import type { TOrgCertificatePreset, TNewOrgCertificatePreset } from '@db/types';

/**
 * Fetches all active certificate presets for a given organization.
 */
export async function getOrgCertificatePresets(
  orgId: string,
  includeInactive = false,
  txClient: DbOrTxClient = db
): Promise<TOrgCertificatePreset[]> {
  if (!orgId) {
    throw new Error('orgId is required to fetch org certificate presets');
  }

  const conditions = [eq(schema.orgCertificatePreset.orgId, orgId)];
  if (!includeInactive) {
    conditions.push(eq(schema.orgCertificatePreset.isActive, true));
  }

  const results = await txClient
    .select()
    .from(schema.orgCertificatePreset)
    .where(and(...conditions))
    .orderBy(schema.orgCertificatePreset.createdAt);

  return results;
}

/**
 * Fetches a single certificate preset by ID within an organization.
 */
export async function getOrgCertificatePreset(
  orgId: string,
  presetId: string,
  txClient: DbOrTxClient = db
): Promise<TOrgCertificatePreset | null> {
  if (!orgId || !presetId) {
    throw new Error('orgId and presetId are required');
  }

  const [preset] = await txClient
    .select()
    .from(schema.orgCertificatePreset)
    .where(and(eq(schema.orgCertificatePreset.orgId, orgId), eq(schema.orgCertificatePreset.id, presetId)))
    .limit(1);

  return preset ?? null;
}

/**
 * Creates a new certificate preset for an organization.
 */
export async function createOrgCertificatePreset(
  data: TNewOrgCertificatePreset,
  txClient: DbOrTxClient = db
): Promise<TOrgCertificatePreset> {
  const [preset] = await txClient
    .insert(schema.orgCertificatePreset)
    .values({ ...data, updatedAt: new Date().toISOString() })
    .returning();

  return preset;
}

/**
 * Updates an existing certificate preset within an organization.
 */
export async function updateOrgCertificatePreset(
  orgId: string,
  presetId: string,
  data: Partial<Pick<TOrgCertificatePreset, 'name' | 'description' | 'design' | 'isActive'>>,
  txClient: DbOrTxClient = db
): Promise<TOrgCertificatePreset | null> {
  if (!orgId || !presetId) {
    throw new Error('orgId and presetId are required to update a certificate preset');
  }

  const [updated] = await txClient
    .update(schema.orgCertificatePreset)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(and(eq(schema.orgCertificatePreset.orgId, orgId), eq(schema.orgCertificatePreset.id, presetId)))
    .returning();

  return updated ?? null;
}

/**
 * Soft-deletes a certificate preset by marking it inactive.
 * Existing courses holding snapshots are preserved.
 */
export async function deactivateOrgCertificatePreset(
  orgId: string,
  presetId: string,
  txClient: DbOrTxClient = db
): Promise<TOrgCertificatePreset | null> {
  return updateOrgCertificatePreset(orgId, presetId, { isActive: false }, txClient);
}
