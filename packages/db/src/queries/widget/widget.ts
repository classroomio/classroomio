import * as schema from '@db/schema';
import type {
  TNewWidget,
  TNewWidgetCourse,
  TNewWidgetVersion,
  TWidget,
  TWidgetCourse,
  TWidgetVersion
} from '@db/types';
import { and, asc, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '@db/drizzle';

export type TWidgetListItem = TWidget & {
  courseCount: number;
};

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

export async function listWidgetsByOrganization(orgId: string): Promise<TWidgetListItem[]> {
  try {
    return db
      .select(widgetListItemSelect())
      .from(schema.widget)
      .leftJoin(schema.widgetCourse, eq(schema.widgetCourse.widgetId, schema.widget.id))
      .where(and(eq(schema.widget.organizationId, orgId), isNull(schema.widget.deletedAt)))
      .groupBy(schema.widget.id)
      .orderBy(desc(schema.widget.updatedAt), asc(schema.widget.name));
  } catch (error) {
    console.error('listWidgetsByOrganization error:', error);
    throw new Error('Failed to list widgets');
  }
}

export async function searchOrgWidgets(orgId: string, search: string, limit: number): Promise<TWidgetListItem[]> {
  try {
    const searchValue = `%${search.trim()}%`;

    return await db
      .select(widgetListItemSelect())
      .from(schema.widget)
      .leftJoin(schema.widgetCourse, eq(schema.widgetCourse.widgetId, schema.widget.id))
      .where(
        and(
          eq(schema.widget.organizationId, orgId),
          isNull(schema.widget.deletedAt),
          ilike(schema.widget.name, searchValue)
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
        and(eq(schema.widget.organizationId, orgId), eq(schema.widget.id, widgetId), isNull(schema.widget.deletedAt))
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
        and(eq(schema.widget.organizationId, orgId), eq(schema.widget.id, widgetId), isNull(schema.widget.deletedAt))
      )
      .limit(1);

    return result ?? null;
  } catch (error) {
    console.error('getWidgetById error:', error);
    throw new Error('Failed to get widget');
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

export async function updateWidget(orgId: string, widgetId: string, data: Partial<TWidget>): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(eq(schema.widget.organizationId, orgId), eq(schema.widget.id, widgetId), isNull(schema.widget.deletedAt))
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('updateWidget error:', error);
    throw new Error('Failed to update widget');
  }
}

export async function archiveWidget(orgId: string, widgetId: string, updatedByUserId: string): Promise<TWidget | null> {
  try {
    const [result] = await db
      .update(schema.widget)
      .set({
        status: 'ARCHIVED',
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByUserId
      })
      .where(
        and(eq(schema.widget.organizationId, orgId), eq(schema.widget.id, widgetId), isNull(schema.widget.deletedAt))
      )
      .returning();

    return result ?? null;
  } catch (error) {
    console.error('archiveWidget error:', error);
    throw new Error('Failed to archive widget');
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
      .where(and(eq(schema.widget.publicKey, publicKey), isNull(schema.widget.deletedAt)))
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
