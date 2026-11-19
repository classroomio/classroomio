import * as schema from '@db/schema';

import type { TBlockLocale, TLocale } from '@db/types';
import { and, db, eq, inArray, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export async function listBlockLocales(blockIds: string[], dbClient: DbOrTxClient = db): Promise<TBlockLocale[]> {
  if (blockIds.length === 0) return [];

  try {
    return await dbClient.select().from(schema.blockLocale).where(inArray(schema.blockLocale.blockId, blockIds));
  } catch (error) {
    console.error('listBlockLocales error:', error);
    throw new Error(`Failed to list block locales: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getBlockLocale(
  blockId: string,
  locale: TLocale,
  dbClient: DbOrTxClient = db
): Promise<TBlockLocale | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.blockLocale)
      .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getBlockLocale error:', error);
    throw new Error(`Failed to get block locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function upsertBlockLocale(
  values: { blockId: string; locale: TLocale; content: string | null },
  dbClient: DbOrTxClient = db
): Promise<TBlockLocale> {
  try {
    const [row] = await dbClient
      .insert(schema.blockLocale)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.blockLocale.blockId, schema.blockLocale.locale],
        set: { content: values.content, updatedAt: sql`now()` }
      })
      .returning();
    if (!row) {
      throw new Error('Upsert returned no row');
    }

    return row;
  } catch (error) {
    console.error('upsertBlockLocale error:', error);
    throw new Error(`Failed to upsert block locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteBlockLocale(blockId: string, locale: TLocale, dbClient: DbOrTxClient = db) {
  try {
    const [row] = await dbClient
      .delete(schema.blockLocale)
      .where(and(eq(schema.blockLocale.blockId, blockId), eq(schema.blockLocale.locale, locale)))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('deleteBlockLocale error:', error);
    throw new Error(`Failed to delete block locale: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function copyBlockLocales(fromBlockId: string, toBlockId: string, dbClient: DbOrTxClient = db) {
  try {
    await dbClient.execute(sql`
      INSERT INTO block_locale (block_id, locale, content)
      SELECT ${toBlockId}::uuid, locale, content FROM block_locale WHERE block_id = ${fromBlockId}::uuid
    `);
  } catch (error) {
    console.error('copyBlockLocales error:', error);
    throw new Error(`Failed to copy block locales: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
