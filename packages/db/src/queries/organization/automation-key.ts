import * as schema from '@db/schema';

import { and, count, desc, eq, isNull, not, sql, type SQL } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TNewOrganizationApiKey, TOrganizationApiKey, TOrganizationApiKeyType } from '@db/types';

import { normalizeBackfillOrgId } from '../backfill';

export const createOrganizationApiKey = async (data: TNewOrganizationApiKey): Promise<TOrganizationApiKey> => {
  try {
    const [row] = await db.insert(schema.organizationApiKey).values(data).returning();

    if (!row) {
      throw new Error('Failed to create organization API key');
    }

    return row;
  } catch (error) {
    console.error('createOrganizationApiKey error:', error);
    throw new Error('Failed to create organization API key');
  }
};

export const listOrganizationApiKeys = async (
  organizationId: string,
  type?: TOrganizationApiKeyType
): Promise<TOrganizationApiKey[]> => {
  try {
    const conditions = [eq(schema.organizationApiKey.organizationId, organizationId)];

    if (type) {
      conditions.push(eq(schema.organizationApiKey.type, type));
    }

    return db
      .select()
      .from(schema.organizationApiKey)
      .where(and(...conditions))
      .orderBy(desc(schema.organizationApiKey.createdAt));
  } catch (error) {
    console.error('listOrganizationApiKeys error:', error);
    throw new Error('Failed to list organization API keys');
  }
};

export const countActiveOrganizationApiKeys = async (
  organizationId: string,
  type: TOrganizationApiKeyType
): Promise<number> => {
  try {
    const [row] = await db
      .select({ total: count() })
      .from(schema.organizationApiKey)
      .where(
        and(
          eq(schema.organizationApiKey.organizationId, organizationId),
          eq(schema.organizationApiKey.type, type),
          isNull(schema.organizationApiKey.revokedAt)
        )
      );

    return Number(row?.total ?? 0);
  } catch (error) {
    console.error('countActiveOrganizationApiKeys error:', error);
    throw new Error('Failed to count active organization API keys');
  }
};

export const getOrganizationApiKeyById = async (
  organizationId: string,
  keyId: string
): Promise<TOrganizationApiKey | null> => {
  try {
    const [row] = await db
      .select()
      .from(schema.organizationApiKey)
      .where(and(eq(schema.organizationApiKey.organizationId, organizationId), eq(schema.organizationApiKey.id, keyId)))
      .limit(1);

    return row || null;
  } catch (error) {
    console.error('getOrganizationApiKeyById error:', error);
    throw new Error('Failed to get organization API key by id');
  }
};

export const getActiveOrganizationApiKeyByHash = async (secretHash: string): Promise<TOrganizationApiKey | null> => {
  try {
    const [row] = await db
      .select()
      .from(schema.organizationApiKey)
      .where(and(eq(schema.organizationApiKey.secretHash, secretHash), isNull(schema.organizationApiKey.revokedAt)))
      .limit(1);

    return row || null;
  } catch (error) {
    console.error('getActiveOrganizationApiKeyByHash error:', error);
    throw new Error('Failed to get organization API key by hash');
  }
};

export const updateOrganizationApiKey = async (
  organizationId: string,
  keyId: string,
  data: Partial<TOrganizationApiKey>
): Promise<TOrganizationApiKey | null> => {
  try {
    const [row] = await db
      .update(schema.organizationApiKey)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(schema.organizationApiKey.organizationId, organizationId), eq(schema.organizationApiKey.id, keyId)))
      .returning();

    return row || null;
  } catch (error) {
    console.error('updateOrganizationApiKey error:', error);
    throw new Error('Failed to update organization API key');
  }
};

export const rotateOrganizationApiKeyIfActive = async (
  organizationId: string,
  keyId: string,
  data: Pick<TOrganizationApiKey, 'secretPrefix' | 'secretHash'>
): Promise<TOrganizationApiKey | null> => {
  try {
    const [row] = await db
      .update(schema.organizationApiKey)
      .set({
        secretPrefix: data.secretPrefix,
        secretHash: data.secretHash,
        lastUsedAt: null,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.organizationApiKey.organizationId, organizationId),
          eq(schema.organizationApiKey.id, keyId),
          isNull(schema.organizationApiKey.revokedAt)
        )
      )
      .returning();

    return row || null;
  } catch (error) {
    console.error('rotateOrganizationApiKeyIfActive error:', error);
    throw new Error('Failed to rotate organization API key');
  }
};

export type OrganizationApiKeyScopeBackfill = {
  type: TOrganizationApiKeyType;
  /** Only keys holding every one of these scopes are widened, so narrower custom keys are left alone. */
  requiredScopes: string[];
  scopesToAdd: string[];
  organizationId?: string;
};

function buildScopeBackfillWhere(backfill: OrganizationApiKeyScopeBackfill): SQL | undefined {
  const requiredScopesJson = JSON.stringify(backfill.requiredScopes);
  const scopesToAddJson = JSON.stringify(backfill.scopesToAdd);
  const organizationId = normalizeBackfillOrgId(backfill.organizationId);

  return and(
    eq(schema.organizationApiKey.type, backfill.type),
    sql`${schema.organizationApiKey.scopes} @> ${requiredScopesJson}::jsonb`,
    not(sql`${schema.organizationApiKey.scopes} @> ${scopesToAddJson}::jsonb`),
    organizationId ? eq(schema.organizationApiKey.organizationId, organizationId) : undefined
  );
}

export const countOrganizationApiKeysMissingScopes = async (
  backfill: OrganizationApiKeyScopeBackfill,
  dbClient: DbOrTxClient = db
): Promise<number> => {
  try {
    const [row] = await dbClient
      .select({ total: count() })
      .from(schema.organizationApiKey)
      .where(buildScopeBackfillWhere(backfill));

    return row?.total ?? 0;
  } catch (error) {
    console.error('countOrganizationApiKeysMissingScopes error:', error);
    throw new Error('Failed to count organization API keys missing scopes');
  }
};

/**
 * Adds `scopesToAdd` to every matching key. Scopes a key already holds are
 * removed before appending, so a partially widened key gets no duplicates.
 */
export const addScopesToOrganizationApiKeys = async (
  backfill: OrganizationApiKeyScopeBackfill,
  dbClient: DbOrTxClient = db
): Promise<number> => {
  try {
    const scopesToAddJson = JSON.stringify(backfill.scopesToAdd);
    const scopesToAddArray = sql.join(
      backfill.scopesToAdd.map((scope) => sql`${scope}`),
      sql`, `
    );

    const rows = await dbClient
      .update(schema.organizationApiKey)
      .set({
        scopes: sql`(${schema.organizationApiKey.scopes} - ARRAY[${scopesToAddArray}]::text[]) || ${scopesToAddJson}::jsonb`,
        updatedAt: new Date().toISOString()
      })
      .where(buildScopeBackfillWhere(backfill))
      .returning({ id: schema.organizationApiKey.id });

    return rows.length;
  } catch (error) {
    console.error('addScopesToOrganizationApiKeys error:', error);
    throw new Error('Failed to add scopes to organization API keys');
  }
};
