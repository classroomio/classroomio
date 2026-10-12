import * as schema from '@db/schema';

import type { TActivityScorm, TNewActivityScorm } from '@db/types';
import { db, type DbOrTxClient } from '@db/drizzle';
import { eq } from 'drizzle-orm';

export async function getActivityScormByActivityId(
  activityId: string,
  dbClient: DbOrTxClient = db
): Promise<TActivityScorm | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.activityScorm)
      .where(eq(schema.activityScorm.activityId, activityId))
      .limit(1);
    return row || null;
  } catch (error) {
    console.error('getActivityScormByActivityId error:', error);
    throw new Error(
      `Failed to get activity SCORM details "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listActivityScormByAssetId(
  assetId: string,
  dbClient: DbOrTxClient = db
): Promise<TActivityScorm[]> {
  try {
    return await dbClient.select().from(schema.activityScorm).where(eq(schema.activityScorm.assetId, assetId));
  } catch (error) {
    console.error('listActivityScormByAssetId error:', error);
    throw new Error(
      `Failed to list activity SCORM rows for asset "${assetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function upsertActivityScorm(
  data: TNewActivityScorm,
  dbClient: DbOrTxClient = db
): Promise<TActivityScorm> {
  try {
    const [row] = await dbClient
      .insert(schema.activityScorm)
      .values(data)
      .onConflictDoUpdate({
        target: schema.activityScorm.activityId,
        set: {
          assetId: data.assetId,
          completionRule: data.completionRule,
          minScorePercent: data.minScorePercent,
          allowRetakes: data.allowRetakes,
          launchMode: data.launchMode,
          updatedAt: new Date().toISOString()
        }
      })
      .returning();
    if (!row) {
      throw new Error('Failed to upsert activity SCORM details');
    }
    return row;
  } catch (error) {
    console.error('upsertActivityScorm error:', error);
    throw new Error(
      `Failed to upsert activity SCORM details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
