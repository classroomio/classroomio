import { and, asc, eq, inArray } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import type { TNewNoteTagAssignment, TNoteTagAssignment, TTag } from '@db/types';

export interface TNoteTagPreview {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export async function getNoteTagsForOrganization(orgId: string, noteId: string): Promise<TTag[]> {
  try {
    const rows = await db
      .select({ tag: schema.tag })
      .from(schema.noteTagAssignment)
      .innerJoin(schema.tag, eq(schema.noteTagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.noteTagAssignment.noteId, noteId)))
      .orderBy(asc(schema.tag.name));

    return rows.map((row) => row.tag);
  } catch (error) {
    console.error('getNoteTagsForOrganization error:', error);
    throw new Error('Failed to get note tags for organization');
  }
}

export async function getNoteTagsByNoteIdsForOrganization(
  orgId: string,
  noteIds: string[]
): Promise<Record<string, TNoteTagPreview[]>> {
  try {
    const normalizedNoteIds = Array.from(new Set(noteIds.map((id) => id.trim()).filter(Boolean)));
    if (normalizedNoteIds.length === 0) {
      return {};
    }

    const rows = await db
      .select({
        noteId: schema.noteTagAssignment.noteId,
        tagId: schema.tag.id,
        tagName: schema.tag.name,
        tagSlug: schema.tag.slug,
        tagColor: schema.tag.color
      })
      .from(schema.noteTagAssignment)
      .innerJoin(schema.tag, eq(schema.noteTagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), inArray(schema.noteTagAssignment.noteId, normalizedNoteIds)))
      .orderBy(asc(schema.tag.name));

    const grouped: Record<string, TNoteTagPreview[]> = {};
    for (const row of rows) {
      grouped[row.noteId] ??= [];
      grouped[row.noteId].push({
        id: row.tagId,
        name: row.tagName,
        slug: row.tagSlug,
        color: row.tagColor
      });
    }

    return grouped;
  } catch (error) {
    console.error('getNoteTagsByNoteIdsForOrganization error:', error);
    throw new Error('Failed to get note tags by note ids for organization');
  }
}

export async function replaceNoteTagAssignments(noteId: string, tagIds: string[]): Promise<TNoteTagAssignment[]> {
  try {
    const normalizedTagIds = Array.from(new Set(tagIds));

    return db.transaction(async (tx) => {
      await tx.delete(schema.noteTagAssignment).where(eq(schema.noteTagAssignment.noteId, noteId));

      if (normalizedTagIds.length === 0) {
        return [];
      }

      return tx
        .insert(schema.noteTagAssignment)
        .values(
          normalizedTagIds.map(
            (tagId): TNewNoteTagAssignment => ({
              noteId,
              tagId
            })
          )
        )
        .returning();
    });
  } catch (error) {
    console.error('replaceNoteTagAssignments error:', error);
    throw new Error('Failed to replace note tag assignments');
  }
}

export async function getNoteIdsByTagId(orgId: string, ownerId: string, tagId: string): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({
        noteId: schema.noteTagAssignment.noteId
      })
      .from(schema.noteTagAssignment)
      .innerJoin(schema.tag, eq(schema.noteTagAssignment.tagId, schema.tag.id))
      .innerJoin(schema.orgNote, eq(schema.noteTagAssignment.noteId, schema.orgNote.id))
      .where(
        and(
          eq(schema.tag.organizationId, orgId),
          eq(schema.tag.id, tagId),
          eq(schema.orgNote.ownerId, ownerId),
          eq(schema.orgNote.organizationId, orgId)
        )
      );

    return rows.map((row) => row.noteId);
  } catch (error) {
    console.error('getNoteIdsByTagId error:', error);
    throw new Error('Failed to get note ids by tag id');
  }
}
