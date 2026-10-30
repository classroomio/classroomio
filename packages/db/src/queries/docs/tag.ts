import { and, asc, eq, inArray } from 'drizzle-orm';

import * as schema from '@db/schema';
import { db } from '@db/drizzle';
import type { TNewDocTagAssignment, TDocTagAssignment, TTag } from '@db/types';

export interface TDocTagPreview {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export async function getNoteTagsForOrganization(orgId: string, docId: string): Promise<TTag[]> {
  try {
    const rows = await db
      .select({ tag: schema.tag })
      .from(schema.docTagAssignment)
      .innerJoin(schema.tag, eq(schema.docTagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), eq(schema.docTagAssignment.docId, docId)))
      .orderBy(asc(schema.tag.name));

    return rows.map((row) => row.tag);
  } catch (error) {
    console.error('getNoteTagsForOrganization error:', error);
    throw new Error('Failed to get note tags for organization');
  }
}

export async function getNoteTagsByNoteIdsForOrganization(
  orgId: string,
  docIds: string[]
): Promise<Record<string, TDocTagPreview[]>> {
  try {
    const normalizedNoteIds = Array.from(new Set(docIds.map((id) => id.trim()).filter(Boolean)));
    if (normalizedNoteIds.length === 0) {
      return {};
    }

    const rows = await db
      .select({
        docId: schema.docTagAssignment.docId,
        tagId: schema.tag.id,
        tagName: schema.tag.name,
        tagSlug: schema.tag.slug,
        tagColor: schema.tag.color
      })
      .from(schema.docTagAssignment)
      .innerJoin(schema.tag, eq(schema.docTagAssignment.tagId, schema.tag.id))
      .where(and(eq(schema.tag.organizationId, orgId), inArray(schema.docTagAssignment.docId, normalizedNoteIds)))
      .orderBy(asc(schema.tag.name));

    const grouped: Record<string, TDocTagPreview[]> = {};
    for (const row of rows) {
      grouped[row.docId] ??= [];
      grouped[row.docId].push({
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

export async function replaceNoteTagAssignments(docId: string, tagIds: string[]): Promise<TDocTagAssignment[]> {
  try {
    const normalizedTagIds = Array.from(new Set(tagIds));

    return db.transaction(async (tx) => {
      await tx.delete(schema.docTagAssignment).where(eq(schema.docTagAssignment.docId, docId));

      if (normalizedTagIds.length === 0) {
        return [];
      }

      return tx
        .insert(schema.docTagAssignment)
        .values(
          normalizedTagIds.map(
            (tagId): TNewDocTagAssignment => ({
              docId,
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
        docId: schema.docTagAssignment.docId
      })
      .from(schema.docTagAssignment)
      .innerJoin(schema.tag, eq(schema.docTagAssignment.tagId, schema.tag.id))
      .innerJoin(schema.orgDoc, eq(schema.docTagAssignment.docId, schema.orgDoc.id))
      .where(
        and(
          eq(schema.tag.organizationId, orgId),
          eq(schema.tag.id, tagId),
          eq(schema.orgDoc.ownerId, ownerId),
          eq(schema.orgDoc.organizationId, orgId)
        )
      );

    return rows.map((row) => row.docId);
  } catch (error) {
    console.error('getNoteIdsByTagId error:', error);
    throw new Error('Failed to get note ids by tag id');
  }
}
