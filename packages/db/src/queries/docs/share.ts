import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { TDocSharePermission, TOrgNoteShare } from '../../types';
import { noteListSelect, type DocListRow } from './doc';

export type NoteShareGrant = {
  profileId: string;
  permission: TDocSharePermission;
};

export type NoteShareRow = TOrgNoteShare & {
  profileFullname: string | null;
  profileEmail: string | null;
};

const noteShareSelect = {
  id: schema.orgDocShare.id,
  docId: schema.orgDocShare.docId,
  profileId: schema.orgDocShare.profileId,
  sharedBy: schema.orgDocShare.sharedBy,
  permission: schema.orgDocShare.permission,
  createdAt: schema.orgDocShare.createdAt,
  profileFullname: schema.profile.fullname,
  profileEmail: schema.profile.email
};

export async function getNoteSharePermission(
  docId: string,
  profileId: string
): Promise<TDocSharePermission | null> {
  try {
    const [row] = await db
      .select({ permission: schema.orgDocShare.permission })
      .from(schema.orgDocShare)
      .where(and(eq(schema.orgDocShare.docId, docId), eq(schema.orgDocShare.profileId, profileId)))
      .limit(1);

    return row?.permission ?? null;
  } catch (error) {
    console.error('getNoteSharePermission error:', error);
    throw new Error('Failed to get note share permission');
  }
}

export async function listNoteShares(docId: string): Promise<NoteShareRow[]> {
  try {
    return db
      .select(noteShareSelect)
      .from(schema.orgDocShare)
      .innerJoin(schema.profile, eq(schema.orgDocShare.profileId, schema.profile.id))
      .where(eq(schema.orgDocShare.docId, docId))
      .orderBy(schema.orgDocShare.createdAt);
  } catch (error) {
    console.error('listNoteShares error:', error);
    throw new Error('Failed to list note shares');
  }
}

export async function replaceNoteShares(
  docId: string,
  sharedBy: string,
  grants: NoteShareGrant[]
): Promise<NoteShareRow[]> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.orgDocShare).where(eq(schema.orgDocShare.docId, docId));

      if (grants.length === 0) {
        return;
      }

      await tx.insert(schema.orgDocShare).values(
        grants.map((grant) => ({
          docId,
          profileId: grant.profileId,
          sharedBy,
          permission: grant.permission
        }))
      );
    });

    return listNoteShares(docId);
  } catch (error) {
    console.error('replaceNoteShares error:', error);
    throw new Error('Failed to replace note shares');
  }
}

export async function listNotesSharedWithUser(organizationId: string, profileId: string): Promise<DocListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.orgDocShare, eq(schema.orgDocShare.docId, schema.orgDoc.id))
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgDoc.organizationId, organizationId),
          eq(schema.orgDocShare.profileId, profileId),
          ne(schema.orgDoc.visibility, 'team'),
          ne(schema.orgDoc.ownerId, profileId),
          eq(schema.orgDoc.origin, 'organization'),
          eq(schema.orgDoc.isTemplate, false),
          isNull(schema.orgDoc.deletedAt)
        )
      )
      .orderBy(desc(schema.orgDoc.updatedAt));
  } catch (error) {
    console.error('listNotesSharedWithUser error:', error);
    throw new Error('Failed to list notes shared with user');
  }
}

export async function listSharePermissionsForNotes(
  profileId: string,
  docIds: string[]
): Promise<Map<string, TDocSharePermission>> {
  if (docIds.length === 0) {
    return new Map();
  }

  try {
    const rows = await db
      .select({
        docId: schema.orgDocShare.docId,
        permission: schema.orgDocShare.permission
      })
      .from(schema.orgDocShare)
      .where(and(eq(schema.orgDocShare.profileId, profileId), inArray(schema.orgDocShare.docId, docIds)));

    return new Map(rows.map((row) => [row.docId, row.permission]));
  } catch (error) {
    console.error('listSharePermissionsForNotes error:', error);
    throw new Error('Failed to list share permissions for notes');
  }
}
