import * as schema from '@db/schema';

import { and, asc, count, desc, eq, inArray, ne, sql, type SQL, type InferSelectModel } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TAsset, TAssetUsage, TNewAsset, TNewAssetUsage } from '@db/types';

export interface ListAssetsOptions {
  page?: number;
  limit?: number;
  kind?: string;
  status?: string;
  search?: string;
  includeExternal?: boolean;
}

export interface ListAssetsResult {
  items: TAsset[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AssetStorageSummary {
  totalBytes: number;
  internalBytes: number;
  externalAssetCount: number;
  bytesByKind: Record<string, number>;
}

export interface AssetDetachInput {
  usageId?: string;
  targetType?: string;
  targetId?: string;
  slotType?: string;
  slotKey?: string | null;
  position?: number | null;
}

function buildAssetWhereConditions(orgId: string, options: ListAssetsOptions): SQL[] {
  const conditions: SQL[] = [eq(schema.asset.organizationId, orgId)];

  if (options.kind) {
    conditions.push(eq(schema.asset.kind, options.kind));
  }

  if (options.status) {
    conditions.push(eq(schema.asset.status, options.status));
  }

  if (options.includeExternal === false) {
    conditions.push(eq(schema.asset.isExternal, false));
  }

  if (options.search?.trim()) {
    const search = `%${options.search.trim().toLowerCase()}%`;
    conditions.push(
      sql`(
        lower(coalesce(${schema.asset.title}, '')) like ${search}
        or lower(coalesce(${schema.asset.description}, '')) like ${search}
        or lower(coalesce(${schema.asset.storageKey}, '')) like ${search}
      )`
    );
  }

  return conditions;
}

export async function createAsset(values: TNewAsset, dbClient: DbOrTxClient = db): Promise<TAsset> {
  try {
    const [created] = await dbClient.insert(schema.asset).values(values).returning();
    if (!created) {
      throw new Error('Failed to create asset');
    }

    return created;
  } catch (error) {
    console.error('createAsset error:', error);
    throw new Error(`Failed to create asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createOrGetAssetByStorageKey(values: TNewAsset, dbClient: DbOrTxClient = db): Promise<TAsset> {
  try {
    if (!values.storageKey) {
      return createAsset(values, dbClient);
    }

    const [createdOrUpdated] = await dbClient
      .insert(schema.asset)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.asset.organizationId, schema.asset.provider, schema.asset.storageKey],
        set: {
          sourceUrl: values.sourceUrl,
          mimeType: values.mimeType,
          byteSize: values.byteSize,
          checksum: values.checksum,
          title: values.title,
          description: values.description,
          thumbnailUrl: values.thumbnailUrl,
          durationSeconds: values.durationSeconds,
          aspectRatio: values.aspectRatio,
          metadata: values.metadata,
          updatedAt: new Date().toISOString()
        }
      })
      .returning();

    if (!createdOrUpdated) {
      throw new Error('Failed to create or get asset');
    }

    return createdOrUpdated;
  } catch (error) {
    console.error('createOrGetAssetByStorageKey error:', error);
    throw new Error(`Failed to create or get asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssetById(assetId: string, orgId?: string): Promise<TAsset | null> {
  try {
    const conditions = [eq(schema.asset.id, assetId)];
    if (orgId) {
      conditions.push(eq(schema.asset.organizationId, orgId));
    }

    const [item] = await db
      .select()
      .from(schema.asset)
      .where(and(...conditions))
      .limit(1);

    return item || null;
  } catch (error) {
    console.error('getAssetById error:', error);
    throw new Error(`Failed to get asset by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssetsByIds(assetIds: string[], orgId?: string): Promise<TAsset[]> {
  try {
    if (assetIds.length === 0) {
      return [];
    }

    const conditions: SQL[] = [inArray(schema.asset.id, assetIds)];
    if (orgId) {
      conditions.push(eq(schema.asset.organizationId, orgId));
    }

    return await db
      .select()
      .from(schema.asset)
      .where(and(...conditions));
  } catch (error) {
    console.error('getAssetsByIds error:', error);
    throw new Error(`Failed to get assets by ids: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listAssetsByOrg(orgId: string, options: ListAssetsOptions = {}): Promise<ListAssetsResult> {
  try {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const offset = (page - 1) * limit;

    const conditions = buildAssetWhereConditions(orgId, options);

    const [totalRow] = await db
      .select({ count: count(schema.asset.id) })
      .from(schema.asset)
      .where(and(...conditions));

    const total = Number(totalRow?.count ?? 0);

    const items = await db
      .select()
      .from(schema.asset)
      .where(and(...conditions))
      .orderBy(desc(schema.asset.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    };
  } catch (error) {
    console.error('listAssetsByOrg error:', error);
    throw new Error(
      `Failed to list assets by organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateAsset(
  assetId: string,
  orgId: string,
  data: Partial<TAsset>,
  dbClient: DbOrTxClient = db
): Promise<TAsset | null> {
  try {
    const [updated] = await dbClient
      .update(schema.asset)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.asset.id, assetId), eq(schema.asset.organizationId, orgId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('updateAsset error:', error);
    throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function archiveAsset(
  assetId: string,
  orgId: string,
  dbClient: DbOrTxClient = db
): Promise<TAsset | null> {
  try {
    const [updated] = await dbClient
      .update(schema.asset)
      .set({ status: 'archived', updatedAt: new Date().toISOString() })
      .where(and(eq(schema.asset.id, assetId), eq(schema.asset.organizationId, orgId)))
      .returning();

    return updated || null;
  } catch (error) {
    console.error('archiveAsset error:', error);
    throw new Error(`Failed to archive asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteAsset(assetId: string, orgId: string, dbClient: DbOrTxClient = db): Promise<TAsset | null> {
  try {
    const [deleted] = await dbClient
      .delete(schema.asset)
      .where(and(eq(schema.asset.id, assetId), eq(schema.asset.organizationId, orgId)))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('deleteAsset error:', error);
    throw new Error(`Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createAssetUsage(values: TNewAssetUsage, dbClient: DbOrTxClient = db): Promise<TAssetUsage> {
  try {
    const slotType = values.slotType ?? 'lesson_video';
    const [created] = await dbClient
      .insert(schema.assetUsage)
      .values({ ...values, slotType })
      .onConflictDoNothing({
        target: [
          schema.assetUsage.assetId,
          schema.assetUsage.targetType,
          schema.assetUsage.targetId,
          schema.assetUsage.slotType,
          schema.assetUsage.slotKey,
          schema.assetUsage.position
        ]
      })
      .returning();

    if (created) {
      return created;
    }

    const [existing] = await dbClient
      .select()
      .from(schema.assetUsage)
      .where(
        and(
          eq(schema.assetUsage.assetId, values.assetId),
          eq(schema.assetUsage.targetType, values.targetType),
          eq(schema.assetUsage.targetId, values.targetId),
          eq(schema.assetUsage.slotType, slotType),
          values.slotKey == null
            ? sql`${schema.assetUsage.slotKey} is null`
            : eq(schema.assetUsage.slotKey, values.slotKey),
          values.position == null
            ? sql`${schema.assetUsage.position} is null`
            : eq(schema.assetUsage.position, values.position)
        )
      )
      .limit(1);

    if (!existing) {
      throw new Error('Failed to create or get asset usage');
    }

    return existing;
  } catch (error) {
    console.error('createAssetUsage error:', error);
    throw new Error(`Failed to create asset usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteAssetUsage(
  orgId: string,
  assetId: string,
  input: AssetDetachInput,
  dbClient: DbOrTxClient = db
): Promise<TAssetUsage | null> {
  try {
    const conditions: SQL[] = [eq(schema.assetUsage.organizationId, orgId), eq(schema.assetUsage.assetId, assetId)];

    if (input.usageId) {
      conditions.push(eq(schema.assetUsage.id, input.usageId));
    } else {
      if (!input.targetType || !input.targetId || !input.slotType) {
        throw new Error('usageId or targetType/targetId/slotType is required');
      }

      conditions.push(eq(schema.assetUsage.targetType, input.targetType));
      conditions.push(eq(schema.assetUsage.targetId, input.targetId));
      conditions.push(eq(schema.assetUsage.slotType, input.slotType));

      if (input.slotKey == null) {
        conditions.push(sql`${schema.assetUsage.slotKey} is null`);
      } else {
        conditions.push(eq(schema.assetUsage.slotKey, input.slotKey));
      }

      if (input.position == null) {
        conditions.push(sql`${schema.assetUsage.position} is null`);
      } else {
        conditions.push(eq(schema.assetUsage.position, input.position));
      }
    }

    const [deleted] = await dbClient
      .delete(schema.assetUsage)
      .where(and(...conditions))
      .returning();

    return deleted || null;
  } catch (error) {
    console.error('deleteAssetUsage error:', error);
    throw new Error(`Failed to delete asset usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listAssetUsagesByAsset(assetId: string, orgId: string): Promise<TAssetUsage[]> {
  try {
    return await db
      .select()
      .from(schema.assetUsage)
      .where(and(eq(schema.assetUsage.assetId, assetId), eq(schema.assetUsage.organizationId, orgId)))
      .orderBy(asc(schema.assetUsage.targetType), asc(schema.assetUsage.slotType), asc(schema.assetUsage.createdAt));
  } catch (error) {
    console.error('listAssetUsagesByAsset error:', error);
    throw new Error(`Failed to list asset usages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function countAssetUsagesByAsset(assetId: string, orgId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count(schema.assetUsage.id) })
      .from(schema.assetUsage)
      .where(and(eq(schema.assetUsage.assetId, assetId), eq(schema.assetUsage.organizationId, orgId)));

    return Number(result?.count ?? 0);
  } catch (error) {
    console.error('countAssetUsagesByAsset error:', error);
    throw new Error(`Failed to count asset usages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function listAssetsForExport(
  orgId: string,
  options: { includeArchived?: boolean; includeExternal?: boolean } = {}
): Promise<Array<TAsset & { usageCount: number; usages: TAssetUsage[] }>> {
  try {
    const conditions: SQL[] = [eq(schema.asset.organizationId, orgId)];

    if (!options.includeArchived) {
      conditions.push(ne(schema.asset.status, 'archived'));
    }

    if (!options.includeExternal) {
      conditions.push(eq(schema.asset.isExternal, false));
    }

    const assets = await db
      .select()
      .from(schema.asset)
      .where(and(...conditions))
      .orderBy(desc(schema.asset.createdAt));

    if (!assets.length) {
      return [];
    }

    const assetIds = assets.map((item) => item.id);
    const usages = await db
      .select()
      .from(schema.assetUsage)
      .where(and(eq(schema.assetUsage.organizationId, orgId), inArray(schema.assetUsage.assetId, assetIds)));

    const usageByAsset = new Map<string, TAssetUsage[]>();
    for (const usage of usages) {
      const existing = usageByAsset.get(usage.assetId) || [];
      existing.push(usage);
      usageByAsset.set(usage.assetId, existing);
    }

    return assets.map((item) => {
      const itemUsages = usageByAsset.get(item.id) || [];
      return {
        ...item,
        usageCount: itemUsages.length,
        usages: itemUsages
      };
    });
  } catch (error) {
    console.error('listAssetsForExport error:', error);
    throw new Error(`Failed to list assets for export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getAssetStorageSummaryByOrg(
  orgId: string,
  options: { includeArchived?: boolean; includeExternal?: boolean } = {}
): Promise<AssetStorageSummary> {
  try {
    const conditions: SQL[] = [eq(schema.asset.organizationId, orgId)];

    if (!options.includeArchived) {
      conditions.push(ne(schema.asset.status, 'archived'));
    }

    if (!options.includeExternal) {
      conditions.push(eq(schema.asset.isExternal, false));
    }

    const grouped = await db
      .select({
        kind: schema.asset.kind,
        bytes: sql<number>`coalesce(sum(${schema.asset.byteSize}), 0)::bigint`.as('bytes')
      })
      .from(schema.asset)
      .where(and(...conditions))
      .groupBy(schema.asset.kind);

    const [totalRow] = await db
      .select({
        totalBytes: sql<number>`coalesce(sum(${schema.asset.byteSize}), 0)::bigint`.as('total_bytes'),
        internalBytes:
          sql<number>`coalesce(sum(case when ${schema.asset.isExternal} = false then ${schema.asset.byteSize} else 0 end), 0)::bigint`.as(
            'internal_bytes'
          ),
        externalAssetCount:
          sql<number>`coalesce(sum(case when ${schema.asset.isExternal} = true then 1 else 0 end), 0)::int`.as(
            'external_asset_count'
          )
      })
      .from(schema.asset)
      .where(and(...conditions));

    const bytesByKind: Record<string, number> = {};
    for (const row of grouped) {
      bytesByKind[row.kind || 'unknown'] = Number(row.bytes ?? 0);
    }

    return {
      totalBytes: Number(totalRow?.totalBytes ?? 0),
      internalBytes: Number(totalRow?.internalBytes ?? 0),
      externalAssetCount: Number(totalRow?.externalAssetCount ?? 0),
      bytesByKind
    };
  } catch (error) {
    console.error('getAssetStorageSummaryByOrg error:', error);
    throw new Error(`Failed to get asset storage summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export type AssetRow = InferSelectModel<typeof schema.asset>;
export type AssetUsageRow = InferSelectModel<typeof schema.assetUsage>;
