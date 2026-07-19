import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { NoteVideoAnchor } from '../../schema';
import type { TNewOrgNote, TNewOrgNoteVersion, TOrgNote } from '../../types';
import type { TNoteListScope } from '@cio/utils/validation/notes';

export type NoteListRow = TOrgNote & {
  courseTitle: string | null;
  lessonTitle: string | null;
  ownerFullname: string | null;
};

export const noteListSelect = {
  id: schema.orgNote.id,
  organizationId: schema.orgNote.organizationId,
  ownerId: schema.orgNote.ownerId,
  title: schema.orgNote.title,
  content: schema.orgNote.content,
  plainText: schema.orgNote.plainText,
  origin: schema.orgNote.origin,
  visibility: schema.orgNote.visibility,
  slug: schema.orgNote.slug,
  isPinned: schema.orgNote.isPinned,
  isTemplate: schema.orgNote.isTemplate,
  courseId: schema.orgNote.courseId,
  lessonId: schema.orgNote.lessonId,
  videoAnchors: schema.orgNote.videoAnchors,
  convertedCourseId: schema.orgNote.convertedCourseId,
  parentId: schema.orgNote.parentId,
  sortOrder: schema.orgNote.sortOrder,
  coverImageUrl: schema.orgNote.coverImageUrl,
  createdAt: schema.orgNote.createdAt,
  updatedAt: schema.orgNote.updatedAt,
  deletedAt: schema.orgNote.deletedAt,
  courseTitle: schema.course.title,
  lessonTitle: schema.lesson.title,
  ownerFullname: schema.profile.fullname
};

export type SidebarNoteRow = NoteListRow & {
  isFavorited: boolean;
};

export async function countWorkspaceNotesByOwner(organizationId: string, ownerId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.orgNote)
      .where(
        and(
          eq(schema.orgNote.organizationId, organizationId),
          eq(schema.orgNote.ownerId, ownerId),
          eq(schema.orgNote.origin, 'workspace'),
          eq(schema.orgNote.isTemplate, false),
          isNull(schema.orgNote.deletedAt)
        )
      );

    return row?.count ?? 0;
  } catch (error) {
    console.error('countWorkspaceNotesByOwner error:', error);
    throw new Error('Failed to count workspace notes');
  }
}

export async function listNotesByOwner(params: {
  organizationId: string;
  ownerId: string;
  origin?: 'workspace' | 'lesson_capture';
  courseId?: string;
  lessonId?: string;
  search?: string;
  tagId?: string;
}): Promise<NoteListRow[]> {
  return listAccessibleNotes({
    organizationId: params.organizationId,
    userId: params.ownerId,
    isTeamMember: false,
    scope: 'mine',
    origin: params.origin,
    courseId: params.courseId,
    lessonId: params.lessonId,
    search: params.search,
    tagId: params.tagId
  });
}

export async function listAccessibleNotes(params: {
  organizationId: string;
  userId: string;
  isTeamMember: boolean;
  scope?: TNoteListScope;
  origin?: 'workspace' | 'lesson_capture';
  courseId?: string;
  lessonId?: string;
  search?: string;
  tagId?: string;
  isTemplate?: boolean;
}): Promise<NoteListRow[]> {
  try {
    const scope = params.isTeamMember ? (params.scope ?? 'mine') : 'mine';
    const conditions = [eq(schema.orgNote.organizationId, params.organizationId), isNull(schema.orgNote.deletedAt)];

    if (scope === 'mine') {
      conditions.push(eq(schema.orgNote.ownerId, params.userId));
    } else if (scope === 'team') {
      conditions.push(eq(schema.orgNote.visibility, 'team'));
      conditions.push(eq(schema.orgNote.origin, 'workspace'));
      conditions.push(ne(schema.orgNote.ownerId, params.userId));
    } else {
      conditions.push(
        or(
          eq(schema.orgNote.ownerId, params.userId),
          and(eq(schema.orgNote.visibility, 'team'), eq(schema.orgNote.origin, 'workspace'))
        )!
      );
    }

    if (params.isTemplate === true) {
      conditions.push(eq(schema.orgNote.isTemplate, true));
      conditions.push(eq(schema.orgNote.origin, 'workspace'));
    } else if (params.isTemplate === false) {
      conditions.push(eq(schema.orgNote.isTemplate, false));
    } else if (scope !== 'team') {
      conditions.push(eq(schema.orgNote.isTemplate, false));
    }

    if (params.origin) {
      conditions.push(eq(schema.orgNote.origin, params.origin));
    }

    if (params.courseId) {
      conditions.push(eq(schema.orgNote.courseId, params.courseId));
    }

    if (params.lessonId) {
      conditions.push(eq(schema.orgNote.lessonId, params.lessonId));
    }

    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(or(ilike(schema.orgNote.title, term), ilike(schema.orgNote.plainText, term))!);
    }

    if (params.tagId) {
      conditions.push(eq(schema.noteTagAssignment.tagId, params.tagId));
    }

    const query = db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id));

    if (params.tagId) {
      return query
        .innerJoin(schema.noteTagAssignment, eq(schema.noteTagAssignment.noteId, schema.orgNote.id))
        .where(and(...conditions))
        .orderBy(desc(schema.orgNote.updatedAt));
    }

    return query.where(and(...conditions)).orderBy(desc(schema.orgNote.updatedAt));
  } catch (error) {
    console.error('listAccessibleNotes error:', error);
    throw new Error('Failed to list notes');
  }
}

export async function listNotesForSidebar(params: {
  organizationId: string;
  userId: string;
}): Promise<SidebarNoteRow[]> {
  try {
    const readableCondition = or(
      eq(schema.orgNote.ownerId, params.userId),
      eq(schema.orgNote.visibility, 'team'),
      eq(schema.orgNote.visibility, 'public'),
      sql`EXISTS (
        SELECT 1 FROM ${schema.orgNoteShare}
        WHERE ${schema.orgNoteShare.noteId} = ${schema.orgNote.id}
          AND ${schema.orgNoteShare.profileId} = ${params.userId}
      )`
    )!;

    const rows = await db
      .select({
        ...noteListSelect,
        isFavorited: sql<boolean>`CASE WHEN ${schema.orgNoteFavorite.id} IS NULL THEN false ELSE true END`
      })
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .leftJoin(
        schema.orgNoteFavorite,
        and(
          eq(schema.orgNoteFavorite.noteId, schema.orgNote.id),
          eq(schema.orgNoteFavorite.profileId, params.userId)
        )
      )
      .where(
        and(
          eq(schema.orgNote.organizationId, params.organizationId),
          eq(schema.orgNote.origin, 'workspace'),
          eq(schema.orgNote.isTemplate, false),
          isNull(schema.orgNote.deletedAt),
          readableCondition
        )
      )
      .orderBy(asc(schema.orgNote.parentId), asc(schema.orgNote.sortOrder), desc(schema.orgNote.updatedAt));

    return rows;
  } catch (error) {
    console.error('listNotesForSidebar error:', error);
    throw new Error('Failed to list notes for sidebar');
  }
}

export async function listNoteChildren(noteId: string): Promise<NoteListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(and(eq(schema.orgNote.parentId, noteId), isNull(schema.orgNote.deletedAt)))
      .orderBy(asc(schema.orgNote.sortOrder), desc(schema.orgNote.updatedAt));
  } catch (error) {
    console.error('listNoteChildren error:', error);
    throw new Error('Failed to list note children');
  }
}

export async function listTrashedNotes(ownerId: string, organizationId: string): Promise<NoteListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgNote.organizationId, organizationId),
          eq(schema.orgNote.ownerId, ownerId),
          eq(schema.orgNote.origin, 'workspace'),
          isNotNull(schema.orgNote.deletedAt)
        )
      )
      .orderBy(desc(schema.orgNote.deletedAt));
  } catch (error) {
    console.error('listTrashedNotes error:', error);
    throw new Error('Failed to list trashed notes');
  }
}

export async function restoreNote(noteId: string): Promise<TOrgNote | null> {
  try {
    const [row] = await db
      .update(schema.orgNote)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(schema.orgNote.id, noteId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('restoreNote error:', error);
    throw new Error('Failed to restore note');
  }
}

export async function hardDeleteNote(noteId: string): Promise<void> {
  try {
    await db.delete(schema.orgNote).where(eq(schema.orgNote.id, noteId));
  } catch (error) {
    console.error('hardDeleteNote error:', error);
    throw new Error('Failed to permanently delete note');
  }
}

export async function cascadeNoteVisibility(
  noteId: string,
  visibility: TOrgNote['visibility']
): Promise<void> {
  try {
    const queue = [noteId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      const children = await db
        .select({ id: schema.orgNote.id })
        .from(schema.orgNote)
        .where(and(eq(schema.orgNote.parentId, currentId), isNull(schema.orgNote.deletedAt)));

      const childIds = children.map((child) => child.id);

      if (childIds.length === 0) {
        continue;
      }

      await db
        .update(schema.orgNote)
        .set({ visibility, updatedAt: new Date().toISOString() })
        .where(inArray(schema.orgNote.id, childIds));

      queue.push(...childIds);
    }
  } catch (error) {
    console.error('cascadeNoteVisibility error:', error);
    throw new Error('Failed to cascade note visibility');
  }
}

export async function wouldCreateCycle(noteId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) {
    return false;
  }

  if (noteId === newParentId) {
    return true;
  }

  try {
    let current: string | null = newParentId;
    const visited = new Set<string>();

    while (current) {
      if (current === noteId) {
        return true;
      }

      if (visited.has(current)) {
        return false;
      }

      visited.add(current);

      const [row] = await db
        .select({ parentId: schema.orgNote.parentId })
        .from(schema.orgNote)
        .where(eq(schema.orgNote.id, current))
        .limit(1);

      current = row?.parentId ?? null;
    }

    return false;
  } catch (error) {
    console.error('wouldCreateCycle error:', error);
    throw new Error('Failed to check note parent cycle');
  }
}

export async function getMaxChildSortOrder(parentId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ max: sql<number>`coalesce(max(${schema.orgNote.sortOrder}), -1)` })
      .from(schema.orgNote)
      .where(and(eq(schema.orgNote.parentId, parentId), isNull(schema.orgNote.deletedAt)));

    return row?.max ?? -1;
  } catch (error) {
    console.error('getMaxChildSortOrder error:', error);
    throw new Error('Failed to get max child sort order');
  }
}

export async function getNoteById(noteId: string): Promise<NoteListRow | null> {
  try {
    const [row] = await db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(and(eq(schema.orgNote.id, noteId), isNull(schema.orgNote.deletedAt)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getNoteById error:', error);
    throw new Error('Failed to get note');
  }
}

export async function getNoteByIdIncludingDeleted(noteId: string): Promise<NoteListRow | null> {
  try {
    const [row] = await db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(eq(schema.orgNote.id, noteId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getNoteByIdIncludingDeleted error:', error);
    throw new Error('Failed to get note');
  }
}

export async function getLessonCaptureNote(params: {
  organizationId: string;
  ownerId: string;
  lessonId: string;
}): Promise<TOrgNote | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.orgNote)
      .where(
        and(
          eq(schema.orgNote.organizationId, params.organizationId),
          eq(schema.orgNote.ownerId, params.ownerId),
          eq(schema.orgNote.lessonId, params.lessonId),
          eq(schema.orgNote.origin, 'lesson_capture'),
          isNull(schema.orgNote.deletedAt)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonCaptureNote error:', error);
    throw new Error('Failed to get lesson capture note');
  }
}

export async function createNote(values: TNewOrgNote): Promise<TOrgNote> {
  try {
    const [row] = await db.insert(schema.orgNote).values(values).returning();

    if (!row) {
      throw new Error('Insert returned no row');
    }

    return row;
  } catch (error) {
    console.error('createNote error:', error);
    throw new Error('Failed to create note');
  }
}

export async function listNoteTemplates(organizationId: string): Promise<NoteListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgNote)
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgNote.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgNote.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgNote.organizationId, organizationId),
          eq(schema.orgNote.origin, 'workspace'),
          eq(schema.orgNote.isTemplate, true),
          isNull(schema.orgNote.deletedAt)
        )
      )
      .orderBy(desc(schema.orgNote.updatedAt));
  } catch (error) {
    console.error('listNoteTemplates error:', error);
    throw new Error('Failed to list note templates');
  }
}

export async function updateNote(
  noteId: string,
  values: Partial<
    Pick<
      TOrgNote,
      | 'title'
      | 'content'
      | 'plainText'
      | 'videoAnchors'
      | 'visibility'
      | 'slug'
      | 'isPinned'
      | 'isTemplate'
      | 'convertedCourseId'
      | 'parentId'
      | 'sortOrder'
      | 'coverImageUrl'
      | 'ownerId'
      | 'updatedAt'
    >
  >
): Promise<TOrgNote | null> {
  try {
    const [row] = await db.update(schema.orgNote).set(values).where(eq(schema.orgNote.id, noteId)).returning();
    return row ?? null;
  } catch (error) {
    console.error('updateNote error:', error);
    throw new Error('Failed to update note');
  }
}

export async function softDeleteNote(noteId: string): Promise<TOrgNote | null> {
  try {
    const [row] = await db
      .update(schema.orgNote)
      .set({ deletedAt: sql`timezone('utc'::text, now())` })
      .where(eq(schema.orgNote.id, noteId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('softDeleteNote error:', error);
    throw new Error('Failed to delete note');
  }
}

export async function insertNoteVersion(values: TNewOrgNoteVersion) {
  try {
    const [row] = await db.insert(schema.orgNoteVersion).values(values).returning();
    return row;
  } catch (error) {
    console.error('insertNoteVersion error:', error);
    throw new Error('Failed to insert note version');
  }
}

export async function getNoteVersionHistory(noteId: string, endRange: number) {
  try {
    return db
      .select()
      .from(schema.orgNoteVersion)
      .where(eq(schema.orgNoteVersion.noteId, noteId))
      .orderBy(desc(schema.orgNoteVersion.timestamp))
      .limit(endRange + 1);
  } catch (error) {
    console.error('getNoteVersionHistory error:', error);
    throw new Error('Failed to get note version history');
  }
}

export async function getNoteVersionById(noteId: string, versionId: number) {
  try {
    const [row] = await db
      .select()
      .from(schema.orgNoteVersion)
      .where(and(eq(schema.orgNoteVersion.noteId, noteId), eq(schema.orgNoteVersion.id, versionId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getNoteVersionById error:', error);
    throw new Error('Failed to get note version');
  }
}

export async function listPublicNoteSlugsForOrganization(
  organizationId: string,
  excludeNoteId?: string
): Promise<string[]> {
  try {
    const conditions = [
      eq(schema.orgNote.organizationId, organizationId),
      isNull(schema.orgNote.deletedAt),
      sql`${schema.orgNote.slug} IS NOT NULL`
    ];

    if (excludeNoteId) {
      conditions.push(ne(schema.orgNote.id, excludeNoteId));
    }

    const rows = await db
      .select({ slug: schema.orgNote.slug })
      .from(schema.orgNote)
      .where(and(...conditions));

    return rows.map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    console.error('listPublicNoteSlugsForOrganization error:', error);
    throw new Error('Failed to list public note slugs');
  }
}

export interface PublicNoteView {
  id: string;
  slug: string;
  title: string;
  content: string;
  plainText: string;
  updatedAt: string;
  ownerFullname: string | null;
  org: {
    id: string;
    name: string;
    siteName: string | null;
    avatarUrl: string | null;
  };
}

export async function getPublicNoteByOrgSiteAndSlug(
  siteName: string,
  noteSlug: string
): Promise<PublicNoteView | null> {
  try {
    const [row] = await db
      .select({
        id: schema.orgNote.id,
        slug: schema.orgNote.slug,
        title: schema.orgNote.title,
        content: schema.orgNote.content,
        plainText: schema.orgNote.plainText,
        updatedAt: schema.orgNote.updatedAt,
        ownerFullname: schema.profile.fullname,
        orgId: schema.organization.id,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        orgAvatarUrl: schema.organization.avatarUrl
      })
      .from(schema.orgNote)
      .innerJoin(schema.organization, eq(schema.orgNote.organizationId, schema.organization.id))
      .innerJoin(schema.profile, eq(schema.orgNote.ownerId, schema.profile.id))
      .where(
        and(
          eq(schema.organization.siteName, siteName),
          eq(schema.orgNote.slug, noteSlug),
          eq(schema.orgNote.visibility, 'public'),
          eq(schema.orgNote.origin, 'workspace'),
          eq(schema.orgNote.isTemplate, false),
          isNull(schema.orgNote.deletedAt)
        )
      )
      .limit(1);

    if (!row?.slug) {
      return null;
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      plainText: row.plainText,
      updatedAt: row.updatedAt,
      ownerFullname: row.ownerFullname,
      org: {
        id: row.orgId,
        name: row.orgName,
        siteName: row.orgSiteName,
        avatarUrl: row.orgAvatarUrl
      }
    };
  } catch (error) {
    console.error('getPublicNoteByOrgSiteAndSlug error:', error);
    throw new Error('Failed to get public note');
  }
}

export type { NoteVideoAnchor };
