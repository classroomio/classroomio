import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import { resolveSlugCollision, slugifyTitle } from '@cio/utils/validation/shared';
import {
  getPublicNoteByOrgSiteAndSlug,
  listPublicNoteSlugsForOrganization,
  type PublicNoteView
} from './note';

export type PublicNoteBreadcrumb = {
  title: string;
  slug: string;
};

export type PublicNoteOutlineItem = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
  depth: number;
};

export type PublicNoteChildItem = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
};

export interface PublicNotePageView extends PublicNoteView {
  parentId: string | null;
  rootTitle: string;
  rootSlug: string;
  breadcrumbs: PublicNoteBreadcrumb[];
  children: PublicNoteChildItem[];
  outline: PublicNoteOutlineItem[];
}

type PublicNoteRow = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
};

async function listPublicNoteRowsForOrganization(organizationId: string): Promise<PublicNoteRow[]> {
  const rows = await db
    .select({
      id: schema.orgNote.id,
      parentId: schema.orgNote.parentId,
      title: schema.orgNote.title,
      slug: schema.orgNote.slug,
      sortOrder: schema.orgNote.sortOrder
    })
    .from(schema.orgNote)
    .where(
      and(
        eq(schema.orgNote.organizationId, organizationId),
        eq(schema.orgNote.visibility, 'public'),
        eq(schema.orgNote.origin, 'workspace'),
        eq(schema.orgNote.isTemplate, false),
        isNull(schema.orgNote.deletedAt),
        sql`${schema.orgNote.slug} IS NOT NULL`
      )
    );

  return rows
    .filter((row): row is PublicNoteRow => Boolean(row.slug))
    .map((row) => ({
      id: row.id,
      parentId: row.parentId,
      title: row.title,
      slug: row.slug!,
      sortOrder: row.sortOrder
    }));
}

function findRootId(rows: Map<string, PublicNoteRow>, noteId: string): string | null {
  let current: string | null = noteId;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) {
      return null;
    }

    visited.add(current);

    const row = rows.get(current);
    if (!row) {
      return null;
    }

    if (!row.parentId) {
      return row.id;
    }

    current = row.parentId;
  }

  return null;
}

function buildBreadcrumbs(
  rows: Map<string, PublicNoteRow>,
  rootId: string,
  noteId: string
): PublicNoteBreadcrumb[] {
  const chain: PublicNoteBreadcrumb[] = [];
  let current: string | null = noteId;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) {
      break;
    }

    visited.add(current);

    const row = rows.get(current);
    if (!row) {
      break;
    }

    chain.unshift({ title: row.title, slug: row.slug });

    if (current === rootId) {
      break;
    }

    current = row.parentId;
  }

  return chain;
}

function isDescendantOfRoot(rows: Map<string, PublicNoteRow>, rootId: string, noteId: string): boolean {
  if (noteId === rootId) {
    return true;
  }

  let current: string | null = noteId;
  const visited = new Set<string>();

  while (current) {
    if (current === rootId) {
      return true;
    }

    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    current = rows.get(current)?.parentId ?? null;
  }

  return false;
}

function flattenOutline(rows: Map<string, PublicNoteRow>, rootId: string): PublicNoteOutlineItem[] {
  const childrenByParent = new Map<string, PublicNoteRow[]>();

  for (const row of rows.values()) {
    if (!isDescendantOfRoot(rows, rootId, row.id)) {
      continue;
    }

    const key = row.parentId ?? '';
    const bucket = childrenByParent.get(key) ?? [];
    bucket.push(row);
    childrenByParent.set(key, bucket);
  }

  for (const bucket of childrenByParent.values()) {
    bucket.sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title));
  }

  const outline: PublicNoteOutlineItem[] = [];

  const visit = (noteId: string, depth: number) => {
    const row = rows.get(noteId);

    if (!row) {
      return;
    }

    outline.push({
      id: row.id,
      parentId: row.parentId,
      title: row.title,
      slug: row.slug,
      sortOrder: row.sortOrder,
      depth
    });

    const children = childrenByParent.get(noteId) ?? [];

    for (const child of children) {
      visit(child.id, depth + 1);
    }
  };

  visit(rootId, 0);

  return outline;
}

export async function ensurePublicSlugsForSubtree(organizationId: string, rootNoteId: string): Promise<void> {
  const takenSlugs = new Set(await listPublicNoteSlugsForOrganization(organizationId));
  const queue = [rootNoteId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const children = await db
      .select({
        id: schema.orgNote.id,
        title: schema.orgNote.title,
        slug: schema.orgNote.slug
      })
      .from(schema.orgNote)
      .where(and(eq(schema.orgNote.parentId, currentId), isNull(schema.orgNote.deletedAt)));

    for (const child of children) {
      if (!child.slug) {
        const nextSlug = resolveSlugCollision(slugifyTitle(child.title), Array.from(takenSlugs));
        takenSlugs.add(nextSlug);

        await db
          .update(schema.orgNote)
          .set({ slug: nextSlug, updatedAt: new Date().toISOString() })
          .where(eq(schema.orgNote.id, child.id));
      } else {
        takenSlugs.add(child.slug);
      }

      queue.push(child.id);
    }
  }
}

export async function getPublicNotePageByOrgSiteAndSlug(
  siteName: string,
  noteSlug: string
): Promise<PublicNotePageView | null> {
  const note = await getPublicNoteByOrgSiteAndSlug(siteName, noteSlug);

  if (!note) {
    return null;
  }

  const [meta] = await db
    .select({
      id: schema.orgNote.id,
      parentId: schema.orgNote.parentId,
      organizationId: schema.orgNote.organizationId
    })
    .from(schema.orgNote)
    .where(eq(schema.orgNote.id, note.id))
    .limit(1);

  if (!meta) {
    return null;
  }

  const rowsList = await listPublicNoteRowsForOrganization(meta.organizationId);
  const rows = new Map(rowsList.map((row) => [row.id, row]));

  if (!rows.has(note.id)) {
    rows.set(note.id, {
      id: note.id,
      parentId: meta.parentId,
      title: note.title,
      slug: note.slug,
      sortOrder: 0
    });
  }

  const rootId = findRootId(rows, note.id);

  if (!rootId) {
    return null;
  }

  const root = rows.get(rootId)!;
  const breadcrumbs = buildBreadcrumbs(rows, rootId, note.id);
  const outline = flattenOutline(rows, rootId);

  const children = (await db
    .select({
      id: schema.orgNote.id,
      title: schema.orgNote.title,
      slug: schema.orgNote.slug,
      sortOrder: schema.orgNote.sortOrder
    })
    .from(schema.orgNote)
    .where(
      and(
        eq(schema.orgNote.parentId, note.id),
        eq(schema.orgNote.visibility, 'public'),
        isNull(schema.orgNote.deletedAt),
        sql`${schema.orgNote.slug} IS NOT NULL`
      )
    )
    .orderBy(schema.orgNote.sortOrder))
    .filter((row): row is PublicNoteChildItem => Boolean(row.slug))
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug!,
      sortOrder: row.sortOrder
    }));

  return {
    ...note,
    parentId: meta.parentId,
    rootTitle: root.title,
    rootSlug: root.slug,
    breadcrumbs,
    children,
    outline
  };
}
