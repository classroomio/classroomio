import { AppError, ErrorCodes } from '@cio/utils/errors';
import { blockHasLocalizedContent } from '@cio/utils/validation/block';
import type { TLessonRevisionPlacement } from '@cio/db/types';
import { getBlockVersionHistory } from '@cio/db/queries/block';
import {
  listLessonRevisionBlockIds,
  listLessonTimeline,
  type LessonTimelineCursor,
  type LessonTimelineRow
} from '@cio/db/queries/block/revision';
import { parseBlockVersionCursor } from '../block/block';
import { loadLessonBlocks, type LessonBlock } from '../block/block-view';
import { isSameJson } from '../block/json';

export interface LessonStructureChange {
  kind: 'added' | 'removed' | 'moved' | 'edited';
  blockId: string;
  type: string;
  label: string | null;
  position: string;
  required: boolean;
  watchThreshold: number | null;
}

const BLOCK_LABEL_FIELDS = ['fileName', 'name', 'title', 'alt'] as const;

function blockSnapshotLabel(data: Record<string, unknown> | null): string | null {
  for (const field of BLOCK_LABEL_FIELDS) {
    const value = data?.[field];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }

  const metadata = data?.metadata as Record<string, unknown> | undefined;
  const metadataTitle = metadata?.title;

  return typeof metadataTitle === 'string' && metadataTitle.trim().length > 0 ? metadataTitle.trim() : null;
}

function toStructureChange(
  kind: LessonStructureChange['kind'],
  entry: TLessonRevisionPlacement
): LessonStructureChange {
  return {
    kind,
    blockId: entry.blockId,
    type: entry.type,
    label: blockSnapshotLabel(entry.data),
    position: entry.position,
    required: entry.required,
    watchThreshold: entry.watchThreshold ?? null
  };
}

function diffLessonStructure(
  previous: TLessonRevisionPlacement[] | null,
  current: TLessonRevisionPlacement[] | null
): LessonStructureChange[] {
  if (!previous || !current) return [];

  const previousByBlockId = new Map(previous.map((entry) => [entry.blockId, entry]));
  const currentBlockIds = new Set(current.map((entry) => entry.blockId));
  const changes: LessonStructureChange[] = [];

  for (const entry of current) {
    const earlier = previousByBlockId.get(entry.blockId);
    if (!earlier) {
      changes.push(toStructureChange('added', entry));
      continue;
    }
    if (earlier.position !== entry.position) {
      changes.push(toStructureChange('moved', entry));
      continue;
    }

    const dataChanged = !isSameJson(earlier.data, entry.data);
    const settingsChanged =
      earlier.required !== entry.required || (earlier.watchThreshold ?? null) !== (entry.watchThreshold ?? null);
    if (dataChanged || settingsChanged) {
      changes.push(toStructureChange('edited', entry));
    }
  }

  for (const entry of previous) {
    if (!currentBlockIds.has(entry.blockId)) changes.push(toStructureChange('removed', entry));
  }

  return changes;
}

/**
 * Parses a `<timestamp>|<text|structure>|<row id>` timeline cursor. Malformed input restarts paging.
 */
function parseLessonTimelineCursor(cursor?: string): LessonTimelineCursor | undefined {
  if (!cursor) return undefined;

  const [timestamp, entryType, rawId] = cursor.split('|');
  const id = Number(rawId);
  const isEntryType = entryType === 'text' || entryType === 'structure';
  if (!timestamp || !isEntryType || !Number.isInteger(id) || Number.isNaN(new Date(timestamp).getTime())) {
    return undefined;
  }

  return { timestamp, entryType, id };
}

function toHistoryEntry(row: LessonTimelineRow, lessonId: string, textBlocks: LessonBlock[]) {
  const blockIndex = row.blockId ? textBlocks.findIndex((block) => block.id === row.blockId) : -1;
  const block = blockIndex >= 0 ? textBlocks[blockIndex] : null;
  const isText = row.entryType === 'text';

  return {
    entryType: row.entryType,
    id: row.id,
    lessonId,
    timestamp: row.timestamp,
    sessionStartedAt: row.sessionStartedAt,
    editCount: row.editCount,
    kind: row.kind,
    label: row.label,
    isSealed: row.isSealed,
    source: row.source,
    clientName: row.clientName,
    changeSetId: row.changeSetId,
    undoable: Boolean(row.changeSetId),
    authorId: row.authorId,
    authorName: row.authorName,
    locale: row.locale,
    blockId: row.blockId,
    blockNumber: block ? blockIndex + 1 : null,
    blockCount: textBlocks.length,
    blockRemoved: isText && !block,
    sharedWithOtherLessons: block ? Math.max(block.usageCount - 1, 0) : 0,
    oldContent: row.oldContent,
    newContent: row.newContent,
    changes: isText ? [] : diffLessonStructure(row.previousPlacements, row.placements)
  };
}

/**
 * Gets one keyset page of a lesson's merged version history, newest first: the editing sessions of
 * every text block the lesson has ever placed, in `locale`, and the lesson's structure revisions,
 * each with the block changes since the revision before it.
 */
export async function getLessonHistoryService(lessonId: string, locale: string, limit: number, cursor?: string) {
  try {
    const [blocks, revisionBlockIds] = await Promise.all([
      loadLessonBlocks(lessonId),
      listLessonRevisionBlockIds(lessonId)
    ]);
    const textBlocks = blocks.filter((block) => blockHasLocalizedContent(block.type));
    const blockIds = [...new Set([...textBlocks.map((block) => block.id), ...revisionBlockIds])];
    const page = await listLessonTimeline({
      lessonId,
      blockIds,
      locale,
      limit,
      cursor: parseLessonTimelineCursor(cursor)
    });

    return {
      items: page.items.map((row) => toHistoryEntry(row, lessonId, textBlocks)),
      nextCursor: page.nextCursor
        ? `${page.nextCursor.timestamp}|${page.nextCursor.entryType}|${page.nextCursor.id}`
        : null
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson history',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets one keyset page of the text snapshots of every text block in `locale`, merged newest first,
 * for public API and MCP consumers. Structure revisions are not part of this page.
 */
export async function getLessonTextHistoryService(lessonId: string, locale: string, limit: number, cursor?: string) {
  try {
    const textBlocks = (await loadLessonBlocks(lessonId)).filter((block) => blockHasLocalizedContent(block.type));
    const page = await getBlockVersionHistory(
      textBlocks.map((block) => block.id),
      locale,
      limit,
      parseBlockVersionCursor(cursor)
    );

    return { ...page, items: page.items.map((item) => ({ ...item, lessonId })) };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get lesson history',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
