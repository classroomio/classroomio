import * as schema from '@db/schema';

import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@db/drizzle';
import type { TNewOrganizationApiKey, TOrganizationApiKey, TOrganizationApiKeyType } from '@db/types';

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
