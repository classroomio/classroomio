import { and, asc, desc, eq, ilike, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import type { DocVideoAnchor } from '../../schema';
import type { TNewOrgNote, TNewOrgNoteVersion, TOrgNote } from '../../types';
import type { TDocListScope } from '@cio/utils/validation/docs';

export type DocListRow = TOrgNote & {
  courseTitle: string | null;
  lessonTitle: string | null;
  ownerFullname: string | null;
};

export const noteListSelect = {
  id: schema.orgDoc.id,
  organizationId: schema.orgDoc.organizationId,
  ownerId: schema.orgDoc.ownerId,
  title: schema.orgDoc.title,
  content: schema.orgDoc.content,
  plainText: schema.orgDoc.plainText,
  origin: schema.orgDoc.origin,
  visibility: schema.orgDoc.visibility,
  slug: schema.orgDoc.slug,
  isPinned: schema.orgDoc.isPinned,
  isTemplate: schema.orgDoc.isTemplate,
  courseId: schema.orgDoc.courseId,
  lessonId: schema.orgDoc.lessonId,
  videoAnchors: schema.orgDoc.videoAnchors,
  convertedCourseId: schema.orgDoc.convertedCourseId,
  parentId: schema.orgDoc.parentId,
  sortOrder: schema.orgDoc.sortOrder,
  coverImageUrl: schema.orgDoc.coverImageUrl,
  createdAt: schema.orgDoc.createdAt,
  updatedAt: schema.orgDoc.updatedAt,
  deletedAt: schema.orgDoc.deletedAt,
  courseTitle: schema.course.title,
  lessonTitle: schema.lesson.title,
  ownerFullname: schema.profile.fullname
};

export type SidebarNoteRow = DocListRow & {
  isFavorited: boolean;
};

export async function countOrganizationDocsByOwner(organizationId: string, ownerId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.orgDoc)
      .where(
        and(
          eq(schema.orgDoc.organizationId, organizationId),
          eq(schema.orgDoc.ownerId, ownerId),
          eq(schema.orgDoc.origin, 'organization'),
          eq(schema.orgDoc.isTemplate, false),
          isNull(schema.orgDoc.deletedAt)
        )
      );

    return row?.count ?? 0;
  } catch (error) {
    console.error('countOrganizationDocsByOwner error:', error);
    throw new Error('Failed to count workspace notes');
  }
}

export async function listNotesByOwner(params: {
  organizationId: string;
  ownerId: string;
  origin?: 'organization' | 'lesson_capture';
  courseId?: string;
  lessonId?: string;
  search?: string;
  tagId?: string;
}): Promise<DocListRow[]> {
  return listAccessibleDocs({
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

export async function listAccessibleDocs(params: {
  organizationId: string;
  userId: string;
  isTeamMember: boolean;
  scope?: TDocListScope;
  origin?: 'organization' | 'lesson_capture';
  courseId?: string;
  lessonId?: string;
  search?: string;
  tagId?: string;
  isTemplate?: boolean;
}): Promise<DocListRow[]> {
  try {
    const scope = params.isTeamMember ? (params.scope ?? 'mine') : 'mine';
    const conditions = [eq(schema.orgDoc.organizationId, params.organizationId), isNull(schema.orgDoc.deletedAt)];

    if (scope === 'mine') {
      conditions.push(eq(schema.orgDoc.ownerId, params.userId));
    } else if (scope === 'team') {
      conditions.push(eq(schema.orgDoc.visibility, 'team'));
      conditions.push(eq(schema.orgDoc.origin, 'organization'));
      conditions.push(ne(schema.orgDoc.ownerId, params.userId));
    } else {
      conditions.push(
        or(
          eq(schema.orgDoc.ownerId, params.userId),
          and(eq(schema.orgDoc.visibility, 'team'), eq(schema.orgDoc.origin, 'organization'))
        )!
      );
    }

    if (params.isTemplate === true) {
      conditions.push(eq(schema.orgDoc.isTemplate, true));
      conditions.push(eq(schema.orgDoc.origin, 'organization'));
    } else if (params.isTemplate === false) {
      conditions.push(eq(schema.orgDoc.isTemplate, false));
    } else if (scope !== 'team') {
      conditions.push(eq(schema.orgDoc.isTemplate, false));
    }

    if (params.origin) {
      conditions.push(eq(schema.orgDoc.origin, params.origin));
    }

    if (params.courseId) {
      conditions.push(eq(schema.orgDoc.courseId, params.courseId));
    }

    if (params.lessonId) {
      conditions.push(eq(schema.orgDoc.lessonId, params.lessonId));
    }

    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(or(ilike(schema.orgDoc.title, term), ilike(schema.orgDoc.plainText, term))!);
    }

    if (params.tagId) {
      conditions.push(eq(schema.docTagAssignment.tagId, params.tagId));
    }

    const query = db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id));

    if (params.tagId) {
      return query
        .innerJoin(schema.docTagAssignment, eq(schema.docTagAssignment.docId, schema.orgDoc.id))
        .where(and(...conditions))
        .orderBy(desc(schema.orgDoc.updatedAt));
    }

    return query.where(and(...conditions)).orderBy(desc(schema.orgDoc.updatedAt));
  } catch (error) {
    console.error('listAccessibleDocs error:', error);
    throw new Error('Failed to list notes');
  }
}

export async function listDocsForSidebar(params: {
  organizationId: string;
  userId: string;
}): Promise<SidebarNoteRow[]> {
  try {
    const readableCondition = or(
      eq(schema.orgDoc.ownerId, params.userId),
      eq(schema.orgDoc.visibility, 'team'),
      eq(schema.orgDoc.visibility, 'public'),
      sql`EXISTS (
        SELECT 1 FROM ${schema.orgDocShare}
        WHERE ${schema.orgDocShare.docId} = ${schema.orgDoc.id}
          AND ${schema.orgDocShare.profileId} = ${params.userId}
      )`
    )!;

    const rows = await db
      .select({
        ...noteListSelect,
        isFavorited: sql<boolean>`CASE WHEN ${schema.orgDocFavorite.id} IS NULL THEN false ELSE true END`
      })
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .leftJoin(
        schema.orgDocFavorite,
        and(
          eq(schema.orgDocFavorite.docId, schema.orgDoc.id),
          eq(schema.orgDocFavorite.profileId, params.userId)
        )
      )
      .where(
        and(
          eq(schema.orgDoc.organizationId, params.organizationId),
          eq(schema.orgDoc.origin, 'organization'),
          eq(schema.orgDoc.isTemplate, false),
          isNull(schema.orgDoc.deletedAt),
          readableCondition
        )
      )
      .orderBy(asc(schema.orgDoc.parentId), asc(schema.orgDoc.sortOrder), desc(schema.orgDoc.updatedAt));

    return rows;
  } catch (error) {
    console.error('listDocsForSidebar error:', error);
    throw new Error('Failed to list notes for sidebar');
  }
}

export async function listDocChildren(docId: string): Promise<DocListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(and(eq(schema.orgDoc.parentId, docId), isNull(schema.orgDoc.deletedAt)))
      .orderBy(asc(schema.orgDoc.sortOrder), desc(schema.orgDoc.updatedAt));
  } catch (error) {
    console.error('listDocChildren error:', error);
    throw new Error('Failed to list note children');
  }
}

export async function listTrashedDocs(ownerId: string, organizationId: string): Promise<DocListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgDoc.organizationId, organizationId),
          eq(schema.orgDoc.ownerId, ownerId),
          eq(schema.orgDoc.origin, 'organization'),
          isNotNull(schema.orgDoc.deletedAt)
        )
      )
      .orderBy(desc(schema.orgDoc.deletedAt));
  } catch (error) {
    console.error('listTrashedDocs error:', error);
    throw new Error('Failed to list trashed notes');
  }
}

export async function restoreDoc(docId: string): Promise<TOrgNote | null> {
  try {
    const [row] = await db
      .update(schema.orgDoc)
      .set({ deletedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(schema.orgDoc.id, docId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('restoreDoc error:', error);
    throw new Error('Failed to restore note');
  }
}

export async function hardDeleteDoc(docId: string): Promise<void> {
  try {
    await db.delete(schema.orgDoc).where(eq(schema.orgDoc.id, docId));
  } catch (error) {
    console.error('hardDeleteDoc error:', error);
    throw new Error('Failed to permanently delete note');
  }
}

export async function cascadeNoteVisibility(
  docId: string,
  visibility: TOrgNote['visibility']
): Promise<void> {
  try {
    const queue = [docId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      const children = await db
        .select({ id: schema.orgDoc.id })
        .from(schema.orgDoc)
        .where(and(eq(schema.orgDoc.parentId, currentId), isNull(schema.orgDoc.deletedAt)));

      const childIds = children.map((child) => child.id);

      if (childIds.length === 0) {
        continue;
      }

      await db
        .update(schema.orgDoc)
        .set({ visibility, updatedAt: new Date().toISOString() })
        .where(inArray(schema.orgDoc.id, childIds));

      queue.push(...childIds);
    }
  } catch (error) {
    console.error('cascadeNoteVisibility error:', error);
    throw new Error('Failed to cascade note visibility');
  }
}

export async function wouldCreateCycle(docId: string, newParentId: string | null): Promise<boolean> {
  if (!newParentId) {
    return false;
  }

  if (docId === newParentId) {
    return true;
  }

  try {
    let current: string | null = newParentId;
    const visited = new Set<string>();

    while (current) {
      if (current === docId) {
        return true;
      }

      if (visited.has(current)) {
        return false;
      }

      visited.add(current);

      const [row] = await db
        .select({ parentId: schema.orgDoc.parentId })
        .from(schema.orgDoc)
        .where(eq(schema.orgDoc.id, current))
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
      .select({ max: sql<number>`coalesce(max(${schema.orgDoc.sortOrder}), -1)` })
      .from(schema.orgDoc)
      .where(and(eq(schema.orgDoc.parentId, parentId), isNull(schema.orgDoc.deletedAt)));

    return row?.max ?? -1;
  } catch (error) {
    console.error('getMaxChildSortOrder error:', error);
    throw new Error('Failed to get max child sort order');
  }
}

export async function getDocById(docId: string): Promise<DocListRow | null> {
  try {
    const [row] = await db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(and(eq(schema.orgDoc.id, docId), isNull(schema.orgDoc.deletedAt)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getDocById error:', error);
    throw new Error('Failed to get note');
  }
}

export async function getDocByIdIncludingDeleted(docId: string): Promise<DocListRow | null> {
  try {
    const [row] = await db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(eq(schema.orgDoc.id, docId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getDocByIdIncludingDeleted error:', error);
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
      .from(schema.orgDoc)
      .where(
        and(
          eq(schema.orgDoc.organizationId, params.organizationId),
          eq(schema.orgDoc.ownerId, params.ownerId),
          eq(schema.orgDoc.lessonId, params.lessonId),
          eq(schema.orgDoc.origin, 'lesson_capture'),
          isNull(schema.orgDoc.deletedAt)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonCaptureNote error:', error);
    throw new Error('Failed to get lesson capture note');
  }
}

export async function createDoc(values: TNewOrgNote): Promise<TOrgNote> {
  try {
    const [row] = await db.insert(schema.orgDoc).values(values).returning();

    if (!row) {
      throw new Error('Insert returned no row');
    }

    return row;
  } catch (error) {
    console.error('createDoc error:', error);
    throw new Error('Failed to create note');
  }
}

export async function listDocTemplates(organizationId: string): Promise<DocListRow[]> {
  try {
    return db
      .select(noteListSelect)
      .from(schema.orgDoc)
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .leftJoin(schema.course, eq(schema.orgDoc.courseId, schema.course.id))
      .leftJoin(schema.lesson, eq(schema.orgDoc.lessonId, schema.lesson.id))
      .where(
        and(
          eq(schema.orgDoc.organizationId, organizationId),
          eq(schema.orgDoc.origin, 'organization'),
          eq(schema.orgDoc.isTemplate, true),
          isNull(schema.orgDoc.deletedAt)
        )
      )
      .orderBy(desc(schema.orgDoc.updatedAt));
  } catch (error) {
    console.error('listDocTemplates error:', error);
    throw new Error('Failed to list note templates');
  }
}

export async function updateDoc(
  docId: string,
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
    const [row] = await db.update(schema.orgDoc).set(values).where(eq(schema.orgDoc.id, docId)).returning();
    return row ?? null;
  } catch (error) {
    console.error('updateDoc error:', error);
    throw new Error('Failed to update note');
  }
}

export async function softDeleteDoc(docId: string): Promise<TOrgNote | null> {
  try {
    const [row] = await db
      .update(schema.orgDoc)
      .set({ deletedAt: sql`timezone('utc'::text, now())` })
      .where(eq(schema.orgDoc.id, docId))
      .returning();

    return row ?? null;
  } catch (error) {
    console.error('softDeleteDoc error:', error);
    throw new Error('Failed to delete note');
  }
}

export async function insertNoteVersion(values: TNewOrgNoteVersion) {
  try {
    const [row] = await db.insert(schema.orgDocVersion).values(values).returning();
    return row;
  } catch (error) {
    console.error('insertNoteVersion error:', error);
    throw new Error('Failed to insert note version');
  }
}

export async function getNoteVersionHistory(docId: string, endRange: number) {
  try {
    return db
      .select()
      .from(schema.orgDocVersion)
      .where(eq(schema.orgDocVersion.docId, docId))
      .orderBy(desc(schema.orgDocVersion.timestamp))
      .limit(endRange + 1);
  } catch (error) {
    console.error('getNoteVersionHistory error:', error);
    throw new Error('Failed to get note version history');
  }
}

export async function getNoteVersionById(docId: string, versionId: number) {
  try {
    const [row] = await db
      .select()
      .from(schema.orgDocVersion)
      .where(and(eq(schema.orgDocVersion.docId, docId), eq(schema.orgDocVersion.id, versionId)))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getNoteVersionById error:', error);
    throw new Error('Failed to get note version');
  }
}

export async function listPublicDocSlugsForOrganization(
  organizationId: string,
  excludeNoteId?: string
): Promise<string[]> {
  try {
    const conditions = [
      eq(schema.orgDoc.organizationId, organizationId),
      isNull(schema.orgDoc.deletedAt),
      sql`${schema.orgDoc.slug} IS NOT NULL`
    ];

    if (excludeNoteId) {
      conditions.push(ne(schema.orgDoc.id, excludeNoteId));
    }

    const rows = await db
      .select({ slug: schema.orgDoc.slug })
      .from(schema.orgDoc)
      .where(and(...conditions));

    return rows.map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    console.error('listPublicDocSlugsForOrganization error:', error);
    throw new Error('Failed to list public note slugs');
  }
}

export interface PublicDocView {
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

export async function getPublicDocByOrgSiteAndSlug(
  siteName: string,
  docSlug: string
): Promise<PublicDocView | null> {
  try {
    const [row] = await db
      .select({
        id: schema.orgDoc.id,
        slug: schema.orgDoc.slug,
        title: schema.orgDoc.title,
        content: schema.orgDoc.content,
        plainText: schema.orgDoc.plainText,
        updatedAt: schema.orgDoc.updatedAt,
        ownerFullname: schema.profile.fullname,
        orgId: schema.organization.id,
        orgName: schema.organization.name,
        orgSiteName: schema.organization.siteName,
        orgAvatarUrl: schema.organization.avatarUrl
      })
      .from(schema.orgDoc)
      .innerJoin(schema.organization, eq(schema.orgDoc.organizationId, schema.organization.id))
      .innerJoin(schema.profile, eq(schema.orgDoc.ownerId, schema.profile.id))
      .where(
        and(
          eq(schema.organization.siteName, siteName),
          eq(schema.orgDoc.slug, docSlug),
          eq(schema.orgDoc.visibility, 'public'),
          eq(schema.orgDoc.origin, 'organization'),
          eq(schema.orgDoc.isTemplate, false),
          isNull(schema.orgDoc.deletedAt)
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
    console.error('getPublicDocByOrgSiteAndSlug error:', error);
    throw new Error('Failed to get public note');
  }
}

export type { DocVideoAnchor };
