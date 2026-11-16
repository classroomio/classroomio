import * as schema from '@db/schema';

import type { TCourseCommentAnchorData } from '@cio/utils/validation/course-comment';
import type { TLocale } from '@db/types';
import { and, db, eq, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

export interface TCourseCommentTextAnchorRow {
  id: string;
  courseId: string;
  anchor: TCourseCommentAnchorData;
  textDetached: boolean;
}

export interface TCourseCommentTextAnchorUpdate {
  id: string;
  start: number | null;
  textDetached: boolean;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Every text-anchored thread on one note block in one language, open or resolved.
 */
export async function listCourseCommentTextAnchorsForBlock(
  blockId: string,
  locale: TLocale,
  dbClient: DbOrTxClient = db
): Promise<TCourseCommentTextAnchorRow[]> {
  try {
    return await dbClient
      .select({
        id: schema.courseCommentThread.id,
        courseId: schema.courseCommentThread.courseId,
        anchor: schema.courseCommentThread.anchor,
        textDetached: schema.courseCommentThread.textDetached
      })
      .from(schema.courseCommentThread)
      .where(
        and(
          eq(schema.courseCommentThread.blockId, blockId),
          eq(schema.courseCommentThread.anchorType, 'text'),
          sql`${schema.courseCommentThread.anchor} ->> 'locale' = ${locale}`
        )
      );
  } catch (error) {
    console.error('listCourseCommentTextAnchorsForBlock error:', error);
    throw new Error(`Failed to list text anchors of block "${blockId}": ${errorMessage(error)}`);
  }
}

/**
 * Stores where each quote was found again, or flags it as removed. A null start keeps the old one.
 */
export async function updateCourseCommentTextAnchors(
  updates: TCourseCommentTextAnchorUpdate[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  if (updates.length === 0) return;

  try {
    const updatedAt = new Date().toISOString();

    for (const update of updates) {
      const startPatch =
        update.start === null
          ? {}
          : { anchor: sql`jsonb_set(${schema.courseCommentThread.anchor}, '{start}', to_jsonb(${update.start}::int))` };

      await dbClient
        .update(schema.courseCommentThread)
        .set({ ...startPatch, textDetached: update.textDetached, updatedAt })
        .where(eq(schema.courseCommentThread.id, update.id));
    }
  } catch (error) {
    console.error('updateCourseCommentTextAnchors error:', error);
    throw new Error(`Failed to update text anchors: ${errorMessage(error)}`);
  }
}
