import { type DbOrTxClient } from '@cio/db/drizzle';
import { listLessonBlockRows } from '@cio/db/queries/block';
import {
  extendLessonRevision,
  getLatestLessonRevision,
  hasLessonRevision,
  insertLessonRevision,
  lockLessonRevision
} from '@cio/db/queries/block/revision';
import type { TBlockChangeSource } from '@cio/utils/constants/lesson-version';
import type { TLessonRevisionPlacement } from '@cio/db/types';
import { isSameJson } from './json';

interface RecordLessonRevisionInput {
  lessonId: string;
  authorId: string | null;
  source: TBlockChangeSource;
  clientName?: string | null;
  changeSetId: string | null;
  dbClient: DbOrTxClient;
}

/**
 * The lesson's placements in display order, in the shape revisions record them.
 */
export async function readLessonPlacements(
  lessonId: string,
  dbClient: DbOrTxClient
): Promise<TLessonRevisionPlacement[]> {
  const rows = await listLessonBlockRows(lessonId, dbClient);

  return rows.map(({ placement, block }) => ({
    placementId: placement.id,
    blockId: placement.blockId,
    type: block.type,
    position: placement.position,
    required: placement.required,
    watchThreshold: placement.watchThreshold,
    data: block.data
  }));
}

/**
 * Whether an incoming structural edit folds into the newest revision. Only edits of one change set
 * (an assistant request or a restore) share a revision; every other structural edit gets its own,
 * so the lesson can be rebuilt exactly as it was at any moment.
 */
export function canExtendRevision(
  latest: {
    isSealed: boolean;
    authorId: string | null;
    source: string;
    clientName: string | null;
    changeSetId: string | null;
  } | null,
  {
    authorId,
    source,
    clientName = null,
    changeSetId
  }: Pick<RecordLessonRevisionInput, 'authorId' | 'source' | 'clientName' | 'changeSetId'>
): boolean {
  if (!latest || !changeSetId) return false;
  if (latest.isSealed) return false;
  if ((latest.authorId ?? null) !== authorId) return false;
  if (latest.source !== source) return false;
  if ((latest.clientName ?? null) !== clientName) return false;

  return latest.changeSetId === changeSetId;
}

/**
 * Records the lesson's current placements as a sealed starting revision when the lesson has none,
 * so its first structural change can still be undone or restored past. Call inside the
 * structural write's transaction, before the write.
 */
export async function ensureLessonRevisionBaseline(lessonId: string, dbClient: DbOrTxClient): Promise<void> {
  await lockLessonRevision(lessonId, dbClient);
  if (await hasLessonRevision(lessonId, dbClient)) return;

  const placements = await readLessonPlacements(lessonId, dbClient);
  await insertLessonRevision(
    { lessonId, placements, authorId: null, source: 'editor', changeSetId: null, editCount: 1, isSealed: true },
    dbClient
  );
}

/**
 * Records the lesson's ordered placements after a structural change, one revision per change
 * (or per change set). Text stays in `block_locale_history`.
 *
 * Call inside the transaction of the structural write so a rolled-back change cannot leave a
 * revision behind.
 */
export async function recordLessonRevision({
  lessonId,
  authorId,
  source,
  clientName = null,
  changeSetId,
  dbClient
}: RecordLessonRevisionInput): Promise<void> {
  await lockLessonRevision(lessonId, dbClient);

  const placements = await readLessonPlacements(lessonId, dbClient);
  const latest = await getLatestLessonRevision(lessonId, dbClient);

  if (latest && isSameJson(latest.placements, placements)) return;

  if (canExtendRevision(latest, { authorId, source, clientName, changeSetId })) {
    const extended = await extendLessonRevision(latest!.id, placements, dbClient);
    if (extended) return;
  }

  await insertLessonRevision(
    { lessonId, placements, authorId, source, clientName, changeSetId, editCount: 1, isSealed: false },
    dbClient
  );
}
