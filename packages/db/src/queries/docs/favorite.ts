import { and, eq } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { TOrgNoteFavorite } from '../../types';

export async function addNoteFavorite(profileId: string, docId: string): Promise<TOrgNoteFavorite> {
  try {
    const [row] = await db
      .insert(schema.orgDocFavorite)
      .values({ profileId, docId })
      .onConflictDoNothing()
      .returning();

    if (row) {
      return row;
    }

    const [existing] = await db
      .select()
      .from(schema.orgDocFavorite)
      .where(and(eq(schema.orgDocFavorite.profileId, profileId), eq(schema.orgDocFavorite.docId, docId)))
      .limit(1);

    if (!existing) {
      throw new Error('Failed to add note favorite');
    }

    return existing;
  } catch (error) {
    console.error('addNoteFavorite error:', error);
    throw new Error('Failed to add note favorite');
  }
}

export async function removeNoteFavorite(profileId: string, docId: string): Promise<void> {
  try {
    await db
      .delete(schema.orgDocFavorite)
      .where(and(eq(schema.orgDocFavorite.profileId, profileId), eq(schema.orgDocFavorite.docId, docId)));
  } catch (error) {
    console.error('removeNoteFavorite error:', error);
    throw new Error('Failed to remove note favorite');
  }
}

export async function listFavoriteNoteIds(profileId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ docId: schema.orgDocFavorite.docId })
      .from(schema.orgDocFavorite)
      .where(eq(schema.orgDocFavorite.profileId, profileId));

    return rows.map((row) => row.docId);
  } catch (error) {
    console.error('listFavoriteNoteIds error:', error);
    throw new Error('Failed to list favorite note ids');
  }
}

export async function isNoteFavorited(profileId: string, docId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.orgDocFavorite.id })
      .from(schema.orgDocFavorite)
      .where(and(eq(schema.orgDocFavorite.profileId, profileId), eq(schema.orgDocFavorite.docId, docId)))
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isNoteFavorited error:', error);
    throw new Error('Failed to check note favorite');
  }
}
