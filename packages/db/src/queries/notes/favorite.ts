import { and, eq } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { TOrgNoteFavorite } from '../../types';

export async function addNoteFavorite(profileId: string, noteId: string): Promise<TOrgNoteFavorite> {
  try {
    const [row] = await db
      .insert(schema.orgNoteFavorite)
      .values({ profileId, noteId })
      .onConflictDoNothing()
      .returning();

    if (row) {
      return row;
    }

    const [existing] = await db
      .select()
      .from(schema.orgNoteFavorite)
      .where(and(eq(schema.orgNoteFavorite.profileId, profileId), eq(schema.orgNoteFavorite.noteId, noteId)))
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

export async function removeNoteFavorite(profileId: string, noteId: string): Promise<void> {
  try {
    await db
      .delete(schema.orgNoteFavorite)
      .where(and(eq(schema.orgNoteFavorite.profileId, profileId), eq(schema.orgNoteFavorite.noteId, noteId)));
  } catch (error) {
    console.error('removeNoteFavorite error:', error);
    throw new Error('Failed to remove note favorite');
  }
}

export async function listFavoriteNoteIds(profileId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ noteId: schema.orgNoteFavorite.noteId })
      .from(schema.orgNoteFavorite)
      .where(eq(schema.orgNoteFavorite.profileId, profileId));

    return rows.map((row) => row.noteId);
  } catch (error) {
    console.error('listFavoriteNoteIds error:', error);
    throw new Error('Failed to list favorite note ids');
  }
}

export async function isNoteFavorited(profileId: string, noteId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ id: schema.orgNoteFavorite.id })
      .from(schema.orgNoteFavorite)
      .where(and(eq(schema.orgNoteFavorite.profileId, profileId), eq(schema.orgNoteFavorite.noteId, noteId)))
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isNoteFavorited error:', error);
    throw new Error('Failed to check note favorite');
  }
}
