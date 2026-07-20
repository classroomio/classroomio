import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../drizzle';
import * as schema from '../../schema';
import { resolveSlugCollision, slugifyTitle } from '@cio/utils/validation/shared';
import {
  getPublicDocByOrgSiteAndSlug,
  listPublicDocSlugsForOrganization,
  type PublicDocView
} from './doc';

export type PublicDocBreadcrumb = {
  title: string;
  slug: string;
};

export type PublicDocOutlineItem = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
  depth: number;
};

export type PublicDocChildItem = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
};

export interface PublicDocPageView extends PublicDocView {
  parentId: string | null;
  rootTitle: string;
  rootSlug: string;
  breadcrumbs: PublicDocBreadcrumb[];
  children: PublicDocChildItem[];
  outline: PublicDocOutlineItem[];
}

type PublicDocRow = {
  id: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
};

async function listPublicDocRowsForOrganization(organizationId: string): Promise<PublicDocRow[]> {
  const rows = await db
    .select({
      id: schema.orgDoc.id,
      parentId: schema.orgDoc.parentId,
      title: schema.orgDoc.title,
      slug: schema.orgDoc.slug,
      sortOrder: schema.orgDoc.sortOrder
    })
    .from(schema.orgDoc)
    .where(
      and(
        eq(schema.orgDoc.organizationId, organizationId),
        eq(schema.orgDoc.visibility, 'public'),
        eq(schema.orgDoc.origin, 'organization'),
        eq(schema.orgDoc.isTemplate, false),
        isNull(schema.orgDoc.deletedAt),
        sql`${schema.orgDoc.slug} IS NOT NULL`
      )
    );

  return rows
    .filter((row): row is PublicDocRow => Boolean(row.slug))
    .map((row) => ({
      id: row.id,
      parentId: row.parentId,
      title: row.title,
      slug: row.slug!,
      sortOrder: row.sortOrder
    }));
}

function findRootId(rows: Map<string, PublicDocRow>, docId: string): string | null {
  let current: string | null = docId;
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
  rows: Map<string, PublicDocRow>,
  rootId: string,
  docId: string
): PublicDocBreadcrumb[] {
  const chain: PublicDocBreadcrumb[] = [];
  let current: string | null = docId;
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

function isDescendantOfRoot(rows: Map<string, PublicDocRow>, rootId: string, docId: string): boolean {
  if (docId === rootId) {
    return true;
  }

  let current: string | null = docId;
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

function flattenOutline(rows: Map<string, PublicDocRow>, rootId: string): PublicDocOutlineItem[] {
  const childrenByParent = new Map<string, PublicDocRow[]>();

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

  const outline: PublicDocOutlineItem[] = [];

  const visit = (docId: string, depth: number) => {
    const row = rows.get(docId);

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

    const children = childrenByParent.get(docId) ?? [];

    for (const child of children) {
      visit(child.id, depth + 1);
    }
  };

  visit(rootId, 0);

  return outline;
}

export async function ensurePublicSlugsForSubtree(organizationId: string, rootNoteId: string): Promise<void> {
  const takenSlugs = new Set(await listPublicDocSlugsForOrganization(organizationId));
  const queue = [rootNoteId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const children = await db
      .select({
        id: schema.orgDoc.id,
        title: schema.orgDoc.title,
        slug: schema.orgDoc.slug
      })
      .from(schema.orgDoc)
      .where(and(eq(schema.orgDoc.parentId, currentId), isNull(schema.orgDoc.deletedAt)));

    for (const child of children) {
      if (!child.slug) {
        const nextSlug = resolveSlugCollision(slugifyTitle(child.title), Array.from(takenSlugs));
        takenSlugs.add(nextSlug);

        await db
          .update(schema.orgDoc)
          .set({ slug: nextSlug, updatedAt: new Date().toISOString() })
          .where(eq(schema.orgDoc.id, child.id));
      } else {
        takenSlugs.add(child.slug);
      }

      queue.push(child.id);
    }
  }
}

export async function getPublicDocPageByOrgSiteAndSlug(
  siteName: string,
  docSlug: string
): Promise<PublicDocPageView | null> {
  const note = await getPublicDocByOrgSiteAndSlug(siteName, docSlug);

  if (!note) {
    return null;
  }

  const [meta] = await db
    .select({
      id: schema.orgDoc.id,
      parentId: schema.orgDoc.parentId,
      organizationId: schema.orgDoc.organizationId
    })
    .from(schema.orgDoc)
    .where(eq(schema.orgDoc.id, note.id))
    .limit(1);

  if (!meta) {
    return null;
  }

  const rowsList = await listPublicDocRowsForOrganization(meta.organizationId);
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
      id: schema.orgDoc.id,
      title: schema.orgDoc.title,
      slug: schema.orgDoc.slug,
      sortOrder: schema.orgDoc.sortOrder
    })
    .from(schema.orgDoc)
    .where(
      and(
        eq(schema.orgDoc.parentId, note.id),
        eq(schema.orgDoc.visibility, 'public'),
        isNull(schema.orgDoc.deletedAt),
        sql`${schema.orgDoc.slug} IS NOT NULL`
      )
    )
    .orderBy(schema.orgDoc.sortOrder))
    .filter((row): row is PublicDocChildItem => Boolean(row.slug))
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
