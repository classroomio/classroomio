import { and, desc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { TNoteSharePermission, TOrgNoteShare } from '../../types';
import { noteListSelect, type NoteListRow } from './note';

export type NoteShareGrant = {
  profileId: string;
  permission: TNoteSharePermission;
};

export type NoteShareRow = TOrgNoteShare & {
  profileFullname: string | null;
  profileEmail: string | null;
};

const noteShareSelect = {
  id: schema.orgNoteShare.id,
  noteId: schema.orgNoteShare.noteId,
  profileId: schema.orgNoteShare.profileId,
  sharedBy: schema.orgNoteShare.sharedBy,
  permission: schema.orgNoteShare.permission,
  createdAt: schema.orgNoteShare.createdAt,
  profileFullname: schema.profile.fullname,
  profileEmail: schema.profile.email
};

export async function getNoteSharePermission(
  noteId: string,
  profileId: string
): Promise<TNoteSharePermission | null> {
  try {
    const [row] = await db
      .select({ permission: schema.orgNoteShare.permission })
      .from(schema.orgNoteShare)
      .where(and(eq(schema.orgNoteShare.noteId, noteId), eq(schema.orgNoteShare.profileId, profileId)))
      .limit(1);

    return row?.permission ?? null;
  } catch (error) {
    console.error('getNoteSharePermission error:', error);
    throw new Error('Failed to get note share permission');
  }
}

export async function listNoteShares(noteId: string): Promise<NoteShareRow[]> {
  try {
    return db
      .select(noteShareSelect)
      .from(schema.orgNoteShare)
      .innerJoin(schema.profile, eq(schema.orgNoteShare.profileId, schema.profile.id))
      .where(eq(schema.orgNoteShare.noteId, noteId))
      .orderBy(schema.orgNoteShare.createdAt);
  } catch (error) {
    console.error('listNoteShares error:', error);
    throw new Error('Failed to list note shares');
  }
}

export async function replaceNoteShares(
  noteId: string,
  sharedBy: string,
  grants: NoteShareGrant[]
): Promise<NoteShareRow[]> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.orgNoteShare).where(eq(schema.orgNoteShare.noteId, noteId));

      if (grants.length === 0) {
        return;
      }

      await tx.insert(schema.orgNoteShare).values(
        grants.map((grant) => ({
          noteId,
          profileId: grant.profileId,
          sharedBy,
          permission: grant.permission
        }))
      );
    });

    return listNoteShares(noteId);
  } catch (error) {
    console.error('replaceNoteShares error:', error);
    throw new Error('Failed to replace note shares');
  }
}

export async function listNotesSharedWithUser(organizationId: string, profileId: string): Promise<NoteListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.orgNoteShare, eq(schema.orgNoteShare.noteId, schema.orgNote.id))
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgNote.organizationId, organizationId),
          eq(schema.orgNoteShare.profileId, profileId),
          ne(schema.orgNote.visibility, 'team'),
          ne(schema.orgNote.ownerId, profileId),
          eq(schema.orgNote.origin, 'workspace'),
          eq(schema.orgNote.isTemplate, false),
          isNull(schema.orgNote.deletedAt)
        )
      )
      .orderBy(desc(schema.orgNote.updatedAt));
  } catch (error) {
    console.error('listNotesSharedWithUser error:', error);
    throw new Error('Failed to list notes shared with user');
  }
}

export async function listSharePermissionsForNotes(
  profileId: string,
  noteIds: string[]
): Promise<Map<string, TNoteSharePermission>> {
  if (noteIds.length === 0) {
    return new Map();
  }

  try {
    const rows = await db
      .select({
        noteId: schema.orgNoteShare.noteId,
        permission: schema.orgNoteShare.permission
      })
      .from(schema.orgNoteShare)
      .where(and(eq(schema.orgNoteShare.profileId, profileId), inArray(schema.orgNoteShare.noteId, noteIds)));

    return new Map(rows.map((row) => [row.noteId, row.permission]));
  } catch (error) {
    console.error('listSharePermissionsForNotes error:', error);
    throw new Error('Failed to list share permissions for notes');
  }
}
