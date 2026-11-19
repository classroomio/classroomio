import * as schema from '@db/schema';

import type { TLessonRevision, TLessonRevisionPlacement, TNewLessonRevision } from '@db/types';
import type { TBlockChangeSource, TLessonVersionKind } from '@cio/utils/constants/lesson-version';
import { and, asc, desc, eq, getTableColumns, isNull, lt, lte, ne, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export interface LessonRevisionSessionState extends TLessonRevision {
  msSinceLastEdit: number;
  msSinceSessionStart: number;
}

/** One row of a lesson's merged history: a text block session or a lesson revision. */
export interface LessonTimelineRow {
  entryType: 'text' | 'structure';
  id: number;
  timestamp: string;
  sessionStartedAt: string;
  editCount: number;
  kind: TLessonVersionKind;
  label: string | null;
  isSealed: boolean;
  source: TBlockChangeSource;
  clientName: string | null;
  changeSetId: string | null;
  authorId: string | null;
  authorName: string | null;
  blockId: string | null;
  locale: string | null;
  oldContent: string | null;
  newContent: string | null;
  placements: TLessonRevisionPlacement[] | null;
  previousPlacements: TLessonRevisionPlacement[] | null;
}

export interface ChangeSetTextVersion {
  id: number;
  blockId: string;
  locale: string;
  content: string | null;
  /** The snapshot of the same block locale right before this one; null when this one is the first. */
  previousId: number | null;
  previousContent: string | null;
}

export interface LessonTimelineCursor {
  timestamp: string;
  entryType: 'text' | 'structure';
  id: number;
}

/** A text snapshot located by block and locale, used to rebuild content at a moment. */
export interface BlockLocaleContentAt {
  blockId: string;
  locale: string;
  content: string | null;
}

/**
 * Transaction-scoped lock serializing revision bookkeeping for one lesson, so two overlapping
 * structural edits cannot both open or both extend the same revision.
 */
export async function lockLessonRevision(lessonId: string, dbClient: DbOrTxClient = db) {
  try {
    await dbClient.execute(sql`select pg_advisory_xact_lock(hashtext(${`lesson_revision:${lessonId}`}))`);
  } catch (error) {
    console.error('lockLessonRevision error:', error);
    throw new Error(`Failed to lock lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Newest revision of a lesson plus how long ago it happened, computed by Postgres in the same
 * `localtimestamp` frame the column defaults use.
 */
export async function getLatestLessonRevision(
  lessonId: string,
  dbClient: DbOrTxClient = db
): Promise<LessonRevisionSessionState | null> {
  try {
    const [latest] = await dbClient
      .select({
        ...getTableColumns(schema.lessonRevision),
        msSinceLastEdit: sql<number>`(extract(epoch from (localtimestamp - ${schema.lessonRevision.timestamp})) * 1000)::double precision`,
        msSinceSessionStart: sql<number>`(extract(epoch from (localtimestamp - ${schema.lessonRevision.sessionStartedAt})) * 1000)::double precision`
      })
      .from(schema.lessonRevision)
      .where(eq(schema.lessonRevision.lessonId, lessonId))
      .orderBy(desc(schema.lessonRevision.timestamp), desc(schema.lessonRevision.id))
      .limit(1);

    return latest ?? null;
  } catch (error) {
    console.error('getLatestLessonRevision error:', error);
    throw new Error(
      `Failed to get latest lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function insertLessonRevision(
  values: TNewLessonRevision,
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision> {
  try {
    const [revision] = await dbClient.insert(schema.lessonRevision).values(values).returning();
    if (!revision) throw new Error('Insert returned no row');

    return revision;
  } catch (error) {
    console.error('insertLessonRevision error:', error);
    throw new Error(`Failed to insert lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Folds another structural edit into an open revision.
 * @returns null when the revision was sealed in the meantime, so the caller opens a new one.
 */
export async function extendLessonRevision(
  revisionId: number,
  placements: TLessonRevisionPlacement[],
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision | null> {
  try {
    const [revision] = await dbClient
      .update(schema.lessonRevision)
      .set({
        placements,
        timestamp: sql`localtimestamp`,
        editCount: sql`${schema.lessonRevision.editCount} + 1`
      })
      .where(and(eq(schema.lessonRevision.id, revisionId), eq(schema.lessonRevision.isSealed, false)))
      .returning();

    return revision ?? null;
  } catch (error) {
    console.error('extendLessonRevision error:', error);
    throw new Error(`Failed to extend lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * The revision in force at a moment: the newest one at or before `at` (strictly before when
 * `inclusive` is false).
 * @returns null when the lesson has no revision that old.
 */
export async function getLessonRevisionAt(
  lessonId: string,
  at: string,
  inclusive: boolean,
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision | null> {
  try {
    const timeFilter = inclusive ? lte(schema.lessonRevision.timestamp, at) : lt(schema.lessonRevision.timestamp, at);
    const [revision] = await dbClient
      .select()
      .from(schema.lessonRevision)
      .where(and(eq(schema.lessonRevision.lessonId, lessonId), timeFilter))
      .orderBy(desc(schema.lessonRevision.timestamp), desc(schema.lessonRevision.id))
      .limit(1);

    return revision ?? null;
  } catch (error) {
    console.error('getLessonRevisionAt error:', error);
    throw new Error(`Failed to get lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * The revision inserted just before `revisionId` in the same lesson. Ids follow insertion order,
 * which a change set extending its revision does not disturb.
 * @returns null when `revisionId` is the lesson's first revision.
 */
export async function getPreviousLessonRevision(
  lessonId: string,
  revisionId: number,
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision | null> {
  try {
    const [previous] = await dbClient
      .select()
      .from(schema.lessonRevision)
      .where(and(eq(schema.lessonRevision.lessonId, lessonId), lt(schema.lessonRevision.id, revisionId)))
      .orderBy(desc(schema.lessonRevision.id))
      .limit(1);

    return previous ?? null;
  } catch (error) {
    console.error('getPreviousLessonRevision error:', error);
    throw new Error(
      `Failed to get previous lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Whether the lesson has any recorded revision. */
export async function hasLessonRevision(lessonId: string, dbClient: DbOrTxClient = db): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.lessonRevision.id })
      .from(schema.lessonRevision)
      .where(eq(schema.lessonRevision.lessonId, lessonId))
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('hasLessonRevision error:', error);
    throw new Error(`Failed to check lesson revisions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getLessonRevisionById(
  lessonId: string,
  revisionId: number,
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision | null> {
  try {
    const [revision] = await dbClient
      .select()
      .from(schema.lessonRevision)
      .where(and(eq(schema.lessonRevision.lessonId, lessonId), eq(schema.lessonRevision.id, revisionId)))
      .limit(1);

    return revision ?? null;
  } catch (error) {
    console.error('getLessonRevisionById error:', error);
    throw new Error(`Failed to get lesson revision: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Every block id a lesson has ever placed, according to its revisions.
 */
export async function listLessonRevisionBlockIds(lessonId: string, dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    const rows = await dbClient.execute<{ block_id: string }>(sql`
      SELECT DISTINCT placement->>'blockId' AS block_id
      FROM lesson_revision r, jsonb_array_elements(r.placements) AS placement
      WHERE r.lesson_id = ${lessonId}
    `);

    return rows.map((row) => row.block_id).filter(Boolean);
  } catch (error) {
    console.error('listLessonRevisionBlockIds error:', error);
    throw new Error(
      `Failed to list lesson revision blocks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listChangeSetRevisions(
  lessonId: string,
  changeSetId: string,
  dbClient: DbOrTxClient = db
): Promise<TLessonRevision[]> {
  try {
    return await dbClient
      .select()
      .from(schema.lessonRevision)
      .where(and(eq(schema.lessonRevision.lessonId, lessonId), eq(schema.lessonRevision.changeSetId, changeSetId)))
      .orderBy(asc(schema.lessonRevision.timestamp), asc(schema.lessonRevision.id));
  } catch (error) {
    console.error('listChangeSetRevisions error:', error);
    throw new Error(`Failed to list change set revisions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Seals the newest revision of every lesson in a course, so edits after a publish open a new one.
 */
export async function sealLatestLessonRevisionsForCourse(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    await dbClient.execute(sql`
      UPDATE lesson_revision r
      SET is_sealed = true
      FROM (
        SELECT DISTINCT ON (lr.lesson_id) lr.id
        FROM lesson_revision lr
        JOIN lesson l ON l.id = lr.lesson_id
        WHERE l.course_id = ${courseId}
        ORDER BY lr.lesson_id, lr."timestamp" DESC, lr.id DESC
      ) latest
      WHERE r.id = latest.id
    `);
  } catch (error) {
    console.error('sealLatestLessonRevisionsForCourse error:', error);
    throw new Error(`Failed to seal lesson revisions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Thins old revisions: keeps every revision newer than `keepAllDays`, the last of each day up to
 * `dailyDays`, and always the newest revision of each lesson and every sealed one (publishes and
 * the starting snapshot).
 * @returns Number of revisions deleted.
 */
export async function pruneLessonRevisions(
  options: { keepAllDays: number; dailyDays: number },
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const result = await dbClient.execute<{ id: number }>(sql`
      WITH ranked AS (
        SELECT id,
               "timestamp",
               is_sealed,
               row_number() OVER (PARTITION BY lesson_id ORDER BY "timestamp" DESC, id DESC) AS lesson_rank,
               row_number() OVER (
                 PARTITION BY lesson_id, date_trunc('day', "timestamp")
                 ORDER BY "timestamp" DESC, id DESC
               ) AS day_rank
        FROM lesson_revision
      )
      DELETE FROM lesson_revision r
      USING ranked
      WHERE r.id = ranked.id
        AND ranked.lesson_rank > 1
        AND NOT ranked.is_sealed
        AND ranked."timestamp" < localtimestamp - make_interval(days => ${options.keepAllDays})
        AND (
          ranked.day_rank > 1
          OR ranked."timestamp" < localtimestamp - make_interval(days => ${options.dailyDays})
        )
      RETURNING r.id
    `);

    return result.length;
  } catch (error) {
    console.error('pruneLessonRevisions error:', error);
    throw new Error(`Failed to prune lesson revisions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * The newest text snapshot of every locale of the given blocks at a moment.
 * Blocks or locales with no snapshot that old are absent from the result.
 */
export async function listBlockLocaleContentsAt(
  blockIds: string[],
  at: string,
  inclusive: boolean,
  locale?: string,
  dbClient: DbOrTxClient = db
): Promise<BlockLocaleContentAt[]> {
  if (blockIds.length === 0) return [];

  try {
    const timeFilter = inclusive ? sql`bh."timestamp" <= ${at}` : sql`bh."timestamp" < ${at}`;
    const localeFilter = locale ? sql`AND bl.locale::text = ${locale}` : sql``;
    const rows = await dbClient.execute<{ block_id: string; locale: string; content: string | null }>(sql`
      SELECT DISTINCT ON (bh.block_locale_id) bl.block_id, bl.locale::text AS locale, bh.new_content AS content
      FROM block_locale_history bh
      JOIN block_locale bl ON bl.id = bh.block_locale_id
      WHERE bl.block_id IN (${sql.join(
        blockIds.map((blockId) => sql`${blockId}::uuid`),
        sql`, `
      )})
        AND ${timeFilter}
        ${localeFilter}
      ORDER BY bh.block_locale_id, bh."timestamp" DESC, bh.id DESC
    `);

    return rows.map((row) => ({ blockId: row.block_id, locale: row.locale, content: row.content }));
  } catch (error) {
    console.error('listBlockLocaleContentsAt error:', error);
    throw new Error(`Failed to list block contents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Text snapshots recorded under one change set for the given blocks, oldest first, each with
 * the snapshot of the same block locale that came right before it.
 */
export async function listChangeSetTextVersions(
  changeSetId: string,
  blockIds: string[],
  dbClient: DbOrTxClient = db
): Promise<ChangeSetTextVersion[]> {
  if (blockIds.length === 0) return [];

  try {
    const rows = await dbClient.execute<{
      id: number;
      block_id: string;
      locale: string;
      content: string | null;
      previous_id: number | null;
      previous_content: string | null;
    }>(sql`
      SELECT t.id, t.block_id, t.locale, t.content, t.previous_id, t.previous_content
      FROM (
        SELECT bh.id, bh.change_set_id, bh."timestamp", bl.block_id, bl.locale::text AS locale, bh.new_content AS content,
               lag(bh.id) OVER locale_window AS previous_id,
               lag(bh.new_content) OVER locale_window AS previous_content
        FROM block_locale_history bh
        JOIN block_locale bl ON bl.id = bh.block_locale_id
        WHERE bl.block_id IN (${sql.join(
          blockIds.map((blockId) => sql`${blockId}::uuid`),
          sql`, `
        )})
        WINDOW locale_window AS (PARTITION BY bh.block_locale_id ORDER BY bh."timestamp", bh.id)
      ) t
      WHERE t.change_set_id = ${changeSetId}
      ORDER BY t."timestamp", t.id
    `);

    return rows.map((row) => ({
      id: Number(row.id),
      blockId: row.block_id,
      locale: row.locale,
      content: row.content,
      previousId: row.previous_id === null ? null : Number(row.previous_id),
      previousContent: row.previous_content
    }));
  } catch (error) {
    console.error('listChangeSetTextVersions error:', error);
    throw new Error(`Failed to list change set versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * The moment a text snapshot was recorded, when it belongs to one of `blockIds`.
 * @returns null when the snapshot is missing or belongs to another block.
 */
export async function getTextVersionMoment(
  versionId: number,
  blockIds: string[],
  dbClient: DbOrTxClient = db
): Promise<{ id: number; timestamp: string } | null> {
  if (blockIds.length === 0) return null;

  try {
    const rows = await dbClient.execute<{ id: number; timestamp: string }>(sql`
      SELECT bh.id, bh."timestamp"::text AS timestamp
      FROM block_locale_history bh
      JOIN block_locale bl ON bl.id = bh.block_locale_id
      WHERE bh.id = ${versionId}
        AND bl.block_id IN (${sql.join(
          blockIds.map((blockId) => sql`${blockId}::uuid`),
          sql`, `
        )})
      LIMIT 1
    `);
    const [row] = rows;

    return row ? { id: Number(row.id), timestamp: row.timestamp } : null;
  } catch (error) {
    console.error('getTextVersionMoment error:', error);
    throw new Error(`Failed to get text version: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * One keyset page of a lesson's merged history, newest first: text sessions of `blockIds` in
 * `locale` and the lesson's revisions, each revision paired with the one before it.
 */
export async function listLessonTimeline(
  params: { lessonId: string; blockIds: string[]; locale: string; limit: number; cursor?: LessonTimelineCursor },
  dbClient: DbOrTxClient = db
): Promise<{ items: LessonTimelineRow[]; nextCursor: LessonTimelineCursor | null }> {
  const { lessonId, blockIds, locale, limit, cursor } = params;

  try {
    const textBlockFilter =
      blockIds.length > 0
        ? sql`v.block_id IN (${sql.join(
            blockIds.map((blockId) => sql`${blockId}::uuid`),
            sql`, `
          )})`
        : sql`false`;
    const cursorFilter = cursor
      ? sql`WHERE (t."timestamp", t.entry_type, t.id) < (${cursor.timestamp}::timestamp, ${cursor.entryType}, ${cursor.id})`
      : sql``;

    const rows = await dbClient.execute<{
      entry_type: 'text' | 'structure';
      id: number;
      timestamp: string;
      session_started_at: string;
      edit_count: number;
      kind: TLessonVersionKind;
      label: string | null;
      is_sealed: boolean;
      source: TBlockChangeSource;
      client_name: string | null;
      change_set_id: string | null;
      author_id: string | null;
      author_name: string | null;
      block_id: string | null;
      locale: string | null;
      old_content: string | null;
      new_content: string | null;
      placements: TLessonRevisionPlacement[] | null;
      previous_placements: TLessonRevisionPlacement[] | null;
    }>(sql`
      SELECT * FROM (
        SELECT 'text' AS entry_type, v.id, v."timestamp", v.session_started_at, v.edit_count, v.kind, v.label,
               v.is_sealed, v.source, v.client_name, v.change_set_id, v.author_id, v.author_name, v.block_id, v.locale::text AS locale,
               v.old_content, v.new_content, NULL::jsonb AS placements, NULL::jsonb AS previous_placements
        FROM block_versions v
        WHERE ${textBlockFilter} AND v.locale::text = ${locale}
        UNION ALL
        SELECT 'structure' AS entry_type, r.id, r."timestamp", r.session_started_at, r.edit_count,
               (CASE WHEN r.is_sealed THEN 'manual' ELSE 'auto' END)::"LESSON_VERSION_KIND" AS kind, NULL AS label,
               r.is_sealed, r.source, r.client_name, r.change_set_id, r.author_id, p.fullname AS author_name, NULL::uuid AS block_id,
               NULL AS locale, NULL AS old_content, NULL AS new_content, r.placements,
               lag(r.placements) OVER (ORDER BY r."timestamp", r.id) AS previous_placements
        FROM lesson_revision r
        LEFT JOIN profile p ON p.id = r.author_id
        WHERE r.lesson_id = ${lessonId}
      ) t
      ${cursorFilter}
      ORDER BY t."timestamp" DESC, t.entry_type DESC, t.id DESC
      LIMIT ${limit + 1}
    `);

    const mapped: LessonTimelineRow[] = rows.map((row) => ({
      entryType: row.entry_type,
      id: Number(row.id),
      timestamp: String(row.timestamp),
      sessionStartedAt: String(row.session_started_at),
      editCount: Number(row.edit_count),
      kind: row.kind,
      label: row.label,
      isSealed: row.is_sealed,
      source: row.source,
      clientName: row.client_name,
      changeSetId: row.change_set_id,
      authorId: row.author_id,
      authorName: row.author_name,
      blockId: row.block_id,
      locale: row.locale,
      oldContent: row.old_content,
      newContent: row.new_content,
      placements: row.placements,
      previousPlacements: row.previous_placements
    }));

    const hasMore = mapped.length > limit;
    const items = hasMore ? mapped.slice(0, limit) : mapped;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last ? { timestamp: last.timestamp, entryType: last.entryType, id: last.id } : null
    };
  } catch (error) {
    console.error('listLessonTimeline error:', error);
    throw new Error(`Failed to list lesson timeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
