import { AppError, ErrorCodes } from '@cio/utils/errors';
import { blockHasLocalizedContent } from '@cio/utils/validation/block';
import type { TBlock, TLessonRevision, TLessonRevisionPlacement, TLocale } from '@cio/db/types';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  bumpBlockVersion,
  copyBlockLocales,
  createBlock,
  createPlacement,
  deletePlacements,
  getBlockById,
  getLessonBlockScope,
  isBlockPlacedOutsideLesson,
  listBlockLocales,
  listLessonBlockRows,
  repointPlacement,
  softDeleteBlocksWithoutPlacements,
  touchLessonsUpdatedAt,
  undeleteBlock,
  updateBlockData,
  updatePlacement,
  upsertBlockLocale,
  type LessonBlockRow,
  type LessonBlockScope
} from '@cio/db/queries/block';
import {
  getLessonRevisionAt,
  getLessonRevisionById,
  getPreviousLessonRevision,
  getTextVersionMoment,
  listBlockLocaleContentsAt,
  listChangeSetRevisions,
  listChangeSetTextVersions,
  listLessonRevisionBlockIds
} from '@cio/db/queries/block/revision';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { sanitizeOptionalHtml } from '../../utils/sanitize-html';
import { syncLessonAssetUsages } from './block';
import { recordBlockLocaleVersion } from './block-version';
import { isSameJson } from './json';
import { ensureLessonRevisionBaseline, readLessonPlacements, recordLessonRevision } from './lesson-revision';

export interface LessonStructureActionSummary {
  placementsAdded: number;
  placementsRemoved: number;
  placementsReseated: number;
  blocksCopied: number;
  blocksReattached: number;
  blocksDataRestored: number;
  blocksMissing: number;
  textBlocksChanged: number;
}

export type LessonHistoryEntryRef = { entryType: 'text' | 'structure'; entryId: number };

interface RestoreActor {
  authorId: string | null;
  changeSetId: string;
}

interface TextWrite {
  blockId: string;
  locale: string;
  content: string | null;
}

interface RestorePlan {
  placements: TLessonRevisionPlacement[] | null;
  texts: TextWrite[];
}

interface RestoreContext {
  tx: DbOrTxClient;
  lessonId: string;
  scope: LessonBlockScope;
  actor: RestoreActor;
  summary: LessonStructureActionSummary;
  /** Block placed in this lesson for each block id the plan names, after copies. */
  placedBlockIds: Map<string, string>;
}

const TEMPORARY_POSITION_PREFIX = '~restore-';

function emptySummary(): LessonStructureActionSummary {
  return {
    placementsAdded: 0,
    placementsRemoved: 0,
    placementsReseated: 0,
    blocksCopied: 0,
    blocksReattached: 0,
    blocksDataRestored: 0,
    blocksMissing: 0,
    textBlocksChanged: 0
  };
}

function settingsDiffer(row: LessonBlockRow, snapshot: TLessonRevisionPlacement): boolean {
  return (
    row.placement.position !== snapshot.position ||
    row.placement.required !== snapshot.required ||
    (row.placement.watchThreshold ?? null) !== (snapshot.watchThreshold ?? null)
  );
}

async function copyBlockForLesson(
  context: RestoreContext,
  source: Pick<TBlock, 'id' | 'type' | 'schemaVersion'>,
  data: Record<string, unknown>
): Promise<string> {
  const copy = await createBlock(
    {
      organizationId: context.scope.organizationId,
      type: source.type,
      schemaVersion: source.schemaVersion,
      data,
      createdBy: context.actor.authorId
    },
    context.tx
  );
  await copyBlockLocales(source.id, copy.id, context.tx);
  context.summary.blocksCopied += 1;

  return copy.id;
}

/**
 * Makes the lesson's placements match `placements`. Blocks other lessons use are never changed:
 * the lesson gets its own copy instead. Blocks past their retention window are skipped.
 */
async function applyPlacements(context: RestoreContext, placements: TLessonRevisionPlacement[]): Promise<void> {
  const { tx, lessonId, summary } = context;
  const rows = await listLessonBlockRows(lessonId, tx);
  const targetBlockIds = new Set(placements.map((entry) => entry.blockId));
  const rowsToRemove = rows.filter((row) => !targetBlockIds.has(row.placement.blockId));

  if (rowsToRemove.length > 0) {
    await deletePlacements(
      rowsToRemove.map((row) => row.placement.id),
      tx
    );
    await softDeleteBlocksWithoutPlacements(
      rowsToRemove.map((row) => row.placement.blockId),
      tx
    );
    summary.placementsRemoved = rowsToRemove.length;
  }

  const keptRows = new Map(
    rows.filter((row) => targetBlockIds.has(row.placement.blockId)).map((row) => [row.placement.blockId, row])
  );
  const rowsToReseat = placements.filter((entry) => {
    const row = keptRows.get(entry.blockId);

    return row ? settingsDiffer(row, entry) : false;
  });

  for (const entry of rowsToReseat) {
    const row = keptRows.get(entry.blockId)!;
    await updatePlacement(row.placement.id, { position: `${TEMPORARY_POSITION_PREFIX}${row.placement.id}` }, tx);
  }
  for (const entry of rowsToReseat) {
    const row = keptRows.get(entry.blockId)!;
    await updatePlacement(
      row.placement.id,
      { position: entry.position, required: entry.required, watchThreshold: entry.watchThreshold },
      tx
    );
    summary.placementsReseated += 1;
  }

  for (const entry of placements) {
    const row = keptRows.get(entry.blockId);

    if (row) {
      context.placedBlockIds.set(entry.blockId, entry.blockId);
      if (isSameJson(row.block.data, entry.data)) continue;

      if (await isBlockPlacedOutsideLesson(entry.blockId, lessonId, tx)) {
        const copyId = await copyBlockForLesson(context, row.block, entry.data);
        await repointPlacement(row.placement.id, copyId, tx);
        context.placedBlockIds.set(entry.blockId, copyId);
      } else {
        await updateBlockData(entry.blockId, entry.data, tx);
      }
      summary.blocksDataRestored += 1;
      continue;
    }

    const block = await getBlockById(entry.blockId, tx);
    if (!block) {
      summary.blocksMissing += 1;
      continue;
    }

    if (block.deletedAt) {
      await undeleteBlock(entry.blockId, tx);
      summary.blocksReattached += 1;
    }

    let placedBlockId = entry.blockId;
    if (await isBlockPlacedOutsideLesson(entry.blockId, lessonId, tx)) {
      placedBlockId = await copyBlockForLesson(context, block, entry.data);
    } else if (!isSameJson(block.data, entry.data)) {
      await updateBlockData(entry.blockId, entry.data, tx);
      summary.blocksDataRestored += 1;
    }

    await createPlacement(
      {
        lessonId,
        blockId: placedBlockId,
        position: entry.position,
        required: entry.required,
        watchThreshold: entry.watchThreshold
      },
      tx
    );
    context.placedBlockIds.set(entry.blockId, placedBlockId);
    summary.placementsAdded += 1;
  }
}

/**
 * Writes each text into the block the lesson now places for it, as a `restore` checkpoint. Texts
 * whose block is not in the lesson, or whose content is already current, are skipped. A block
 * other lessons use is replaced in this lesson by its own copy before the write.
 */
async function writeTexts(context: RestoreContext, texts: TextWrite[]): Promise<void> {
  const { tx, lessonId, actor, summary } = context;
  if (texts.length === 0) return;

  const rows = await listLessonBlockRows(lessonId, tx);
  const rowsByBlockId = new Map(rows.map((row) => [row.placement.blockId, row]));
  const currentLocales = await listBlockLocales(
    rows.map((row) => row.placement.blockId),
    tx
  );

  for (const text of texts) {
    const placedBlockId = context.placedBlockIds.get(text.blockId) ?? text.blockId;
    const row = rowsByBlockId.get(placedBlockId);
    if (!row || !blockHasLocalizedContent(row.block.type)) continue;

    const content = sanitizeOptionalHtml(text.content ?? '') ?? '';
    const current = currentLocales.find((entry) => entry.blockId === placedBlockId && entry.locale === text.locale);
    if ((current?.content ?? '') === content) continue;

    let writeBlockId = placedBlockId;
    if (await isBlockPlacedOutsideLesson(placedBlockId, lessonId, tx)) {
      writeBlockId = await copyBlockForLesson(context, row.block, row.block.data);
      await repointPlacement(row.placement.id, writeBlockId, tx);
      rowsByBlockId.set(writeBlockId, { ...row, placement: { ...row.placement, blockId: writeBlockId } });
      context.placedBlockIds.set(text.blockId, writeBlockId);
    }

    const saved = await upsertBlockLocale({ blockId: writeBlockId, locale: text.locale as TLocale, content }, tx);
    await recordBlockLocaleVersion({
      blockLocaleId: saved.id,
      content: saved.content,
      authorId: actor.authorId,
      intent: 'manual',
      source: 'restore',
      changeSetId: actor.changeSetId,
      dbClient: tx
    });
    await bumpBlockVersion(writeBlockId, tx);
    summary.textBlocksChanged += 1;
  }
}

async function applyRestorePlan(
  lessonId: string,
  plan: RestorePlan,
  actor: RestoreActor
): Promise<LessonStructureActionSummary> {
  const summary = emptySummary();

  const courseId = await db.transaction(async (tx) => {
    const scope = await getLessonBlockScope(lessonId, tx);
    if (!scope) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }

    await ensureLessonRevisionBaseline(lessonId, tx);

    const context: RestoreContext = { tx, lessonId, scope, actor, summary, placedBlockIds: new Map() };
    if (plan.placements) {
      await applyPlacements(context, plan.placements);
    }
    await writeTexts(context, plan.texts);

    await syncLessonAssetUsages(lessonId, scope.organizationId, actor.authorId, tx);
    await recordLessonRevision({
      lessonId,
      authorId: actor.authorId,
      source: 'restore',
      changeSetId: actor.changeSetId,
      dbClient: tx
    });
    await touchLessonsUpdatedAt([lessonId], tx);

    return scope.courseId;
  });

  await touchCourseUpdatedAt(courseId);

  return summary;
}

async function listBlockIdsEverInLesson(lessonId: string): Promise<string[]> {
  const [rows, revisionBlockIds] = await Promise.all([
    listLessonBlockRows(lessonId),
    listLessonRevisionBlockIds(lessonId)
  ]);

  return [...new Set([...rows.map((row) => row.placement.blockId), ...revisionBlockIds])];
}

async function resolveTextEntryMoment(lessonId: string, entryId: number): Promise<string> {
  const version = await getTextVersionMoment(entryId, await listBlockIdsEverInLesson(lessonId));
  if (!version) {
    throw new AppError('Version not found in this lesson', ErrorCodes.NOT_FOUND, 404);
  }

  return version.timestamp;
}

/**
 * Restores the whole lesson to one history entry: a structure entry's exact block order and
 * settings, or for a text entry the block order in force when it was saved, plus every locale of
 * every text block as saved at that moment. Text with no saved version that old keeps its current
 * content; blocks past their retention window are skipped.
 */
export async function restoreLessonToEntry(
  lessonId: string,
  entry: LessonHistoryEntryRef,
  actor: { authorId: string | null; changeSetId?: string | null }
): Promise<LessonStructureActionSummary> {
  let moment: string;
  let revision: TLessonRevision | null;
  let includeTextAtMoment = true;

  if (entry.entryType === 'structure') {
    revision = await getLessonRevisionById(lessonId, entry.entryId);
    if (!revision) {
      throw new AppError('Version not found in this lesson', ErrorCodes.NOT_FOUND, 404);
    }
    moment = revision.timestamp;
    includeTextAtMoment = (await getPreviousLessonRevision(lessonId, revision.id)) !== null;
  } else {
    moment = await resolveTextEntryMoment(lessonId, entry.entryId);
    revision = await getLessonRevisionAt(lessonId, moment, true);
  }

  const textBlockIds = revision
    ? revision.placements
        .filter((placement) => blockHasLocalizedContent(placement.type))
        .map((placement) => placement.blockId)
    : (await listLessonBlockRows(lessonId))
        .filter((row) => blockHasLocalizedContent(row.block.type))
        .map((row) => row.placement.blockId);
  const contents = await listBlockLocaleContentsAt(textBlockIds, moment, includeTextAtMoment);

  return applyRestorePlan(
    lessonId,
    {
      placements: revision?.placements ?? null,
      texts: contents.map((content) => ({ blockId: content.blockId, locale: content.locale, content: content.content }))
    },
    { authorId: actor.authorId, changeSetId: actor.changeSetId ?? crypto.randomUUID() }
  );
}

function structureOf(placements: TLessonRevisionPlacement[]) {
  return placements.map((placement) => ({
    blockId: placement.blockId,
    position: placement.position,
    required: placement.required,
    watchThreshold: placement.watchThreshold ?? null,
    data: placement.data
  }));
}

function conflictError(): AppError {
  return new AppError(
    'This change cannot be undone because something it touched was changed after it',
    ErrorCodes.CONFLICT,
    409
  );
}

/**
 * Reverts one change set in this lesson: the block order and settings from just before it (when
 * it changed the structure) and each text it wrote, in every locale, back to what it replaced.
 * Nothing else in the lesson is touched. A later edit blocks the undo only while what the change
 * touched still differs from what the change left, so undoing several changes newest first works.
 * @throws AppError 404 when the change set made no change here, 409 when what it touched was edited
 *   since or nothing older than it is recorded.
 */
export async function undoLessonChangeSet(input: {
  lessonId: string;
  changeSetId: string;
  authorId: string | null;
}): Promise<LessonStructureActionSummary> {
  const { lessonId, changeSetId } = input;
  const blockIds = await listBlockIdsEverInLesson(lessonId);
  const [revisions, textVersions] = await Promise.all([
    listChangeSetRevisions(lessonId, changeSetId),
    listChangeSetTextVersions(changeSetId, blockIds)
  ]);

  if (revisions.length === 0 && textVersions.length === 0) {
    throw new AppError('This change made no edits to this lesson', ErrorCodes.NOT_FOUND, 404);
  }

  const [currentPlacements, currentLocales] = await Promise.all([
    readLessonPlacements(lessonId, db),
    listBlockLocales(blockIds)
  ]);
  const lastRevision = revisions.reduce<TLessonRevision | null>(
    (latest, revision) => (!latest || revision.id > latest.id ? revision : latest),
    null
  );
  if (lastRevision && !isSameJson(structureOf(lastRevision.placements), structureOf(currentPlacements))) {
    throw conflictError();
  }

  const versionsByBlockLocale = new Map<string, typeof textVersions>();
  for (const version of textVersions) {
    const key = `${version.blockId}:${version.locale}`;
    versionsByBlockLocale.set(key, [...(versionsByBlockLocale.get(key) ?? []), version]);
  }

  const texts: TextWrite[] = [];
  for (const versions of versionsByBlockLocale.values()) {
    const first = versions[0];
    const last = versions[versions.length - 1];
    const current = currentLocales.find((entry) => entry.blockId === last.blockId && entry.locale === last.locale);
    if ((current?.content ?? null) !== (last.content ?? null)) {
      throw conflictError();
    }

    if (first.previousId !== null) {
      texts.push({ blockId: first.blockId, locale: first.locale, content: first.previousContent });
    }
  }

  let placements: TLessonRevisionPlacement[] | null = null;
  if (revisions.length > 0) {
    const previous = await getPreviousLessonRevision(lessonId, revisions[0].id);
    if (!previous) {
      throw new AppError(
        'This change cannot be undone because nothing older than it is recorded',
        ErrorCodes.CONFLICT,
        409
      );
    }
    placements = previous.placements;
  }

  return applyRestorePlan(
    lessonId,
    { placements, texts },
    { authorId: input.authorId, changeSetId: crypto.randomUUID() }
  );
}
