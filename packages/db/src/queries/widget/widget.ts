import * as schema from '@db/schema';
import type {
  TNewWidget,
  TNewWidgetCourse,
  TNewWidgetVersion,
  TWidget,
  TWidgetCourse,
  TWidgetVersion
} from '@db/types';
import { and, asc, count, desc, eq, inArray, isNull, ne, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type TWidgetListItem = TWidget & {
  courseCount: number;
};

export type TWidgetListStatusFilter = 'DRAFT' | 'PUBLISHED';

export interface ListOrganizationWidgetsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: TWidgetListStatusFilter | TWidgetListStatusFilter[];
  layoutType?: TWidget['layoutType'] | TWidget['layoutType'][];
  selectionMode?: TWidget['selectionMode'] | TWidget['selectionMode'][];
}

export interface TWidgetListPage {
  items: TWidgetListItem[];
  total: number;
}

const WIDGET_SEARCH_ESCAPE_CHAR = '!';

/**
 * `%` and `_` are ILIKE wildcards, so a search for `100%` would otherwise match any
 * name beginning with `100`, and `a_b` would match `axb`. Escape those, plus the
 * escape character itself, before the surrounding wildcards are added.
 */
function escapeWidgetSearchPattern(value: string) {
  return value.replace(/[!%_]/g, (character) => `${WIDGET_SEARCH_ESCAPE_CHAR}${character}`);
}

/** Contains-match on the widget name, with the caller's text treated as literal text. */
function widgetNameContainsIlike(search: string) {
  const pattern = `%${escapeWidgetSearchPattern(search.trim())}%`;

  // The escape character is a module constant inlined as a literal: Postgres cannot
  // infer a type for a bind parameter in an ESCAPE clause.
  return sql`${schema.widget.name} ILIKE ${pattern} ESCAPE '${sql.raw(WIDGET_SEARCH_ESCAPE_CHAR)}'`;
}

function widgetListItemSelect() {
  return {
    id: schema.widget.id,
    organizationId: schema.widget.organizationId,
    name: schema.widget.name,
    status: schema.widget.status,
    layoutType: schema.widget.layoutType,
    selectionMode: schema.widget.selectionMode,
    publicKey: schema.widget.publicKey,
    config: schema.widget.config,
    hasUnpublishedChanges: schema.widget.hasUnpublishedChanges,
    latestPublishedVersionId: schema.widget.latestPublishedVersionId,
    createdByUserId: schema.widget.createdByUserId,
    updatedByUserId: schema.widget.updatedByUserId,
    deletedAt: schema.widget.deletedAt,
    createdAt: schema.widget.createdAt,
    updatedAt: schema.widget.updatedAt,
    courseCount: sql<number>`COUNT(DISTINCT ${schema.widgetCourse.courseId})`.as('course_count')
  };
}

function toFilterArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];

  return Array.isArray(value) ? value : [value];
}

function buildWidgetListWhereClause(orgId: string, options: ListOrganizationWidgetsOptions, archived: boolean) {
  const conditions = [eq(schema.widget.organizationId, orgId), isNull(schema.widget.deletedAt)];

  conditions.push(archived ? eq(schema.widget.status, 'ARCHIVED') : ne(schema.widget.status, 'ARCHIVED'));

  const search = options.search?.trim();
  if (search) {
    conditions.push(widgetNameContainsIlike(search));
  }

  const statuses = toFilterArray(options.status);
  if (statuses.length > 0 && !archived) {
    conditions.push(inArray(schema.widget.status, statuses));
  }

  const layoutTypes = toFilterArray(options.layoutType);
  if (layoutTypes.length > 0) {
    conditions.push(inArray(schema.widget.layoutType, layoutTypes));
  }

  const selectionModes = toFilterArray(options.selectionMode);
  if (selectionModes.length > 0) {
    conditions.push(inArray(schema.widget.selectionMode, selectionModes));
  }

  return and(...conditions)!;
}

async function listWidgets(orgId: string, options: ListOrganizationWidgetsOptions, archived: boolean) {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
  const offset = (page - 1) * limit;
  const whereClause = buildWidgetListWhereClause(orgId, options, archived);

  const [totalRow] = await db
    .select({ count: count(schema.widget.id) })
    .from(schema.widget)
    .where(whereClause);

  const total = Number(totalRow?.count ?? 0);

  const items = await db
    .select(widgetListItemSelect())
    .from(schema.widget)
    .leftJoin(schema.widgetCourse, eq(schema.widgetCourse.widgetId, schema.widget.id))
    .where(whereClause)
    .groupBy(schema.widget.id)
    .orderBy(desc(schema.widget.updatedAt), asc(schema.widget.name))
    .limit(limit)
    .offset(offset);

  return { items, total } satisfies TWidgetListPage;
}

export async function listWidgetsByOrganization(
  orgId: string,
  options: ListOrganizationWidgetsOptions = {}
): Promise<TWidgetListPage> {
  try {
    return await listWidgets(orgId, options, false);
  } catch (error) {
    console.error('listWidgetsByOrganization error:', error);
    throw new Error('Failed to list widgets');
  }
}

export async function listArchivedWidgetsByOrganization(
  orgId: string,
  options: ListOrganizationWidgetsOptions = {}
): Promise<TWidgetListPage> {
  try {
    return await listWidgets(orgId, options, true);
  } catch (error) {
    console.error('listArchivedWidgetsByOrganization error:', error);
    throw new Error('Failed to list archived widgets');
  }
}

export async function searchOrgWidgets(orgId: string, search: string, limit: number): Promise<TWidgetListItem[]> {
  try {
    return await db
      .select(widgetListItemSelect())
      .from(schema.widget)
      .leftJoin(schema.widgetCourse, eq(schema.widgetCourse.widgetId, schema.widget.id))
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED'),
          widgetNameContainsIlike(search)
        )
      )
      .groupBy(schema.widget.id)
      .orderBy(desc(schema.widget.updatedAt), asc(schema.widget.name))
      .limit(limit);
  } catch (error) {
    console.error('searchOrgWidgets error:', error);
    throw new Error('Failed to search widgets');
  }
}

export async function getWidgetListItemById(orgId: string, widgetId: string): Promise<TWidgetListItem | null> {
  try {
    const [result] = await db
      .select(widgetListItemSelect())
      .from(schema.widget)
      .leftJoin(schema.widgetCourse, eq(schema.widgetCourse.widgetId, schema.widget.id))
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED')
        )
      )
      .groupBy(schema.widget.id)
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getWidgetListItemById error:', error);
    throw new Error('Failed to get widget list item');
  }
}

export async function getWidgetById(orgId: string, widgetId: string): Promise<TWidget | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.widget)
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED')
        )
      )
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getWidgetById error:', error);
    throw new Error('Failed to get widget');
  }
}

/**
 * Retrieves an archived widget by its ID.
 */
export async function getArchivedWidgetById(orgId: string, widgetId: string): Promise<TWidget | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.widget)
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          eq(schema.widget.status, 'ARCHIVED')
        )
      )
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getArchivedWidgetById error:', error);
    throw new Error('Failed to get archived widget');
  }
}

export async function getWidgetByPublicKey(publicKey: string): Promise<TWidget | null> {
  try {
    const [result] = await db
      .select()
      .from(schema.widget)
      .where(and(eq(schema.widget.publicKey, publicKey), isNull(schema.widget.deletedAt)))
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getWidgetByPublicKey error:', error);
    throw new Error('Failed to get widget by public key');
  }
}

export async function createWidget(data: TNewWidget): Promise<TWidget> {
  try {
    const [result] = await db.insert(schema.widget).values(data).returning();
    return result;
  } catch (error) {
    console.error('createWidget error:', error);
    throw new Error('Failed to create widget');
  }
}

/**
 * Updates an active widget.
 */
export async function updateWidget(orgId: string, widgetId: string, data: Partial<TWidget>): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED')
        )
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('updateWidget error:', error);
    throw new Error('Failed to update widget');
  }
}

/**
 * Archives an active widget by setting status to ARCHIVED.
 */
export async function archiveWidget(orgId: string, widgetId: string, updatedByUserId: string): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        status: 'ARCHIVED',
        updatedAt: new Date().toISOString(),
        updatedByUserId
      })
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED')
        )
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('archiveWidget error:', error);
    throw new Error('Failed to archive widget');
  }
}

/**
 * Atomically restores an archived widget by updating status.
 */
export async function restoreArchivedWidget(
  orgId: string,
  widgetId: string,
  status: 'DRAFT' | 'PUBLISHED',
  updatedByUserId: string
): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        updatedByUserId
      })
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          eq(schema.widget.status, 'ARCHIVED')
        )
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('restoreArchivedWidget error:', error);
    throw new Error('Failed to restore widget');
  }
}

/**
 * Permanently soft-deletes an archived widget by setting deletedAt.
 */
export async function deleteArchivedWidget(
  orgId: string,
  widgetId: string,
  updatedByUserId: string
): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByUserId
      })
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widget.id, widgetId),
          isNull(schema.widget.deletedAt),
          eq(schema.widget.status, 'ARCHIVED')
        )
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('deleteArchivedWidget error:', error);
    throw new Error('Failed to delete archived widget');
  }
}

export async function listWidgetCourses(widgetId: string): Promise<TWidgetCourse[]> {
  try {
    return db
      .select()
      .from(schema.widgetCourse)
      .where(eq(schema.widgetCourse.widgetId, widgetId))
      .orderBy(asc(schema.widgetCourse.order), asc(schema.widgetCourse.createdAt));
  } catch (error) {
    console.error('listWidgetCourses error:', error);
    throw new Error('Failed to list widget courses');
  }
}

export async function replaceWidgetCourses(widgetId: string, courseIds: string[]): Promise<TWidgetCourse[]> {
  try {
    const normalizedCourseIds = Array.from(new Set(courseIds));

    return db.transaction(async (tx) => {
      await tx.delete(schema.widgetCourse).where(eq(schema.widgetCourse.widgetId, widgetId));

      if (normalizedCourseIds.length === 0) {
        return [];
      }

      const rowsToInsert: TNewWidgetCourse[] = normalizedCourseIds.map((courseId, index) => ({
        widgetId,
        courseId,
        order: index
      }));

      return tx.insert(schema.widgetCourse).values(rowsToInsert).returning();
    });
  } catch (error) {
    console.error('replaceWidgetCourses error:', error);
    throw new Error('Failed to replace widget courses');
  }
}

/**
 * Updates an active widget and replaces its associated courses in a transaction.
 */
export async function updateWidgetWithCourses(
  orgId: string,
  widgetId: string,
  data: Partial<TWidget>,
  courseIds: string[]
): Promise<TWidget | null> {
  try {
    const normalizedCourseIds = Array.from(new Set(courseIds));

    return db.transaction(async (tx) => {
      const [result] = await tx
        .update(schema.widget)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(
          and(
            eq(schema.widget.organizationId, orgId),
            eq(schema.widget.id, widgetId),
            isNull(schema.widget.deletedAt),
            ne(schema.widget.status, 'ARCHIVED')
          )
        )
        .returning();

      if (!result) {
        return null;
      }

      await tx.delete(schema.widgetCourse).where(eq(schema.widgetCourse.widgetId, widgetId));

      if (normalizedCourseIds.length === 0) {
        return result;
      }

      const rowsToInsert: TNewWidgetCourse[] = normalizedCourseIds.map((courseId, index) => ({
        widgetId,
        courseId,
        order: index
      }));

      await tx.insert(schema.widgetCourse).values(rowsToInsert);

      return result;
    });
  } catch (error) {
    console.error('updateWidgetWithCourses error:', error);
    throw new Error('Failed to update widget with courses');
  }
}

export async function getNextWidgetVersion(widgetId: string): Promise<number> {
  try {
    const [result] = await db
      .select({
        latestVersion: sql<number>`COALESCE(MAX(${schema.widgetVersion.version}), 0)`.as('latest_version')
      })
      .from(schema.widgetVersion)
      .where(eq(schema.widgetVersion.widgetId, widgetId));

    return Number(result?.latestVersion ?? 0) + 1;
  } catch (error) {
    console.error('getNextWidgetVersion error:', error);
    throw new Error('Failed to get next widget version');
  }
}

export async function createWidgetVersion(data: TNewWidgetVersion): Promise<TWidgetVersion> {
  try {
    const [result] = await db.insert(schema.widgetVersion).values(data).returning();
    return result;
  } catch (error) {
    console.error('createWidgetVersion error:', error);
    throw new Error('Failed to create widget version');
  }
}

export async function listWidgetVersions(orgId: string, widgetId: string): Promise<TWidgetVersion[]> {
  try {
    return db
      .select({ version: schema.widgetVersion })
      .from(schema.widgetVersion)
      .innerJoin(schema.widget, eq(schema.widgetVersion.widgetId, schema.widget.id))
      .where(and(eq(schema.widget.organizationId, orgId), eq(schema.widgetVersion.widgetId, widgetId)))
      .orderBy(desc(schema.widgetVersion.version))
      .then((rows) => rows.map((row) => row.version));
  } catch (error) {
    console.error('listWidgetVersions error:', error);
    throw new Error('Failed to list widget versions');
  }
}

export async function getWidgetVersionById(
  orgId: string,
  widgetId: string,
  versionId: string
): Promise<TWidgetVersion | null> {
  try {
    const [result] = await db
      .select({ version: schema.widgetVersion })
      .from(schema.widgetVersion)
      .innerJoin(schema.widget, eq(schema.widgetVersion.widgetId, schema.widget.id))
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          eq(schema.widgetVersion.widgetId, widgetId),
          eq(schema.widgetVersion.id, versionId)
        )
      )
      .limit(1);

    return result?.version ?? null;
  } catch (error) {
    console.error('getWidgetVersionById error:', error);
    throw new Error('Failed to get widget version');
  }
}

export async function getPublishedWidgetPayloadByPublicKey(publicKey: string): Promise<unknown | null> {
  try {
    const [result] = await db
      .select({
        payloadSnapshot: schema.widgetVersion.payloadSnapshot
      })
      .from(schema.widget)
      .innerJoin(schema.widgetVersion, eq(schema.widget.latestPublishedVersionId, schema.widgetVersion.id))
      .where(
        and(
          eq(schema.widget.publicKey, publicKey),
          isNull(schema.widget.deletedAt),
          ne(schema.widget.status, 'ARCHIVED')
        )
      )
      .limit(1);

    return result?.payloadSnapshot ?? null;
  } catch (error) {
    console.error('getPublishedWidgetPayloadByPublicKey error:', error);
    throw new Error('Failed to get published widget payload');
  }
}

export async function getWidgetsByIds(orgId: string, widgetIds: string[]): Promise<TWidget[]> {
  try {
    if (widgetIds.length === 0) {
      return [];
    }

    return db
      .select()
      .from(schema.widget)
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          inArray(schema.widget.id, widgetIds),
          isNull(schema.widget.deletedAt)
        )
      );
  } catch (error) {
    console.error('getWidgetsByIds error:', error);
    throw new Error('Failed to get widgets by ids');
  }
}
