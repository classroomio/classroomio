import { db } from '@db/drizzle';
import { TNewApiKey } from '@db/index';
import * as schema from '@db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

export const createApiKey = async (apiKeyData: TNewApiKey) => {
  try {
    const [created] = await db.insert(schema.apiKey).values(apiKeyData).returning();
    return created;
  } catch (error) {
    console.error('create api key error:', error);
    throw new Error(`Failed to create api key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getApiKeyByHash = async (hash: string) => {
  try {
    const [apiKey] = await db.select().from(schema.apiKey).where(eq(schema.apiKey.keyHash, hash)).limit(1);
    return apiKey;
  } catch (error) {
    console.error('get api key by hash error:', error);
    throw new Error(`Failed to get api key by hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getApiKeysByOrganizationId = async (organizationId: string) => {
  try {
    const apiKeys = await db
      .select()
      .from(schema.apiKey)
      .where(eq(schema.apiKey.organizationId, organizationId))
      .orderBy(desc(schema.apiKey.createdAt));
    return apiKeys;
  } catch (error) {
    console.error('get api keys by organization id error:', error);
    throw new Error(
      `Failed to get api keys by organization id: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const revokeApiKey = async (hash: string) => {
  try {
    const result = await db.update(schema.apiKey).set({ isRevoked: true }).where(eq(schema.apiKey.keyHash, hash));
    return result;
  } catch (error) {
    console.error('revoke api key error:', error);
    throw new Error(`Failed to revoke api key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateLastUsed = async (hash: string) => {
  try {
    const result = await db
      .update(schema.apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKey.keyHash, hash));
    return result;
  } catch (error) {
    console.error('update api key last used error:', error);
    throw new Error(`Failed to update api key last used: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
