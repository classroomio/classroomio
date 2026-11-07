import * as schema from '@db/schema';

import type { TBlockLocaleHistory, TBlockVersion, TNewBlockLocaleHistory } from '@db/types';
import type { TLessonVersionKind } from '@cio/utils/constants/lesson-version';
import { and, desc, eq, getTableColumns, lt, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/** Keyset cursor: the (timestamp, id) of the last row already returned. */
export type TBlockVersionCursor = {
  timestamp: string;
  id: number;
};

export type TBlockVersionPage = {
  items: TBlockVersion[];
  /** Null when the last page has been reached. */
  nextCursor: TBlockVersionCursor | null;
};

/**
 * Newest snapshot plus how long ago it happened, used to decide whether an
 * autosave folds into an open editing session.
 *
 * The elapsed times are computed by Postgres rather than in JS. `timestamp` and
 * `session_started_at` are `timestamp without time zone` written by
 * `CURRENT_TIMESTAMP`, so they hold *local* wall time. Parsing those strings in
 * JS and diffing against `Date.now()` silently skews by the server's UTC offset,
 * which made every save look older than the session window and defeated
 * coalescing entirely. `localtimestamp` keeps both sides of the subtraction in
 * the same frame.
 */
export interface BlockVersionSessionState extends TBlockLocaleHistory {
  msSinceLastEdit: number;
  msSinceSessionStart: number;
}

export async function getLatestBlockLocaleVersion(
  blockLocaleId: number,
  dbClient?: DbOrTxClient
): Promise<BlockVersionSessionState | null> {
  const client = dbClient ?? db;

  try {
    const [latest] = await client
      .select({
        ...getTableColumns(schema.blockLocaleHistory),
        msSinceLastEdit: sql<number>`(extract(epoch from (localtimestamp - ${schema.blockLocaleHistory.timestamp})) * 1000)::double precision`,
        msSinceSessionStart: sql<number>`(extract(epoch from (localtimestamp - ${schema.blockLocaleHistory.sessionStartedAt})) * 1000)::double precision`
      })
      .from(schema.blockLocaleHistory)
      .where(eq(schema.blockLocaleHistory.blockLocaleId, blockLocaleId))
      .orderBy(desc(schema.blockLocaleHistory.timestamp), desc(schema.blockLocaleHistory.id))
      .limit(1);

    return latest ?? null;
  } catch (error) {
    console.error('getLatestBlockLocaleVersion error:', error);
    throw new Error(
      `Failed to get latest block locale version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Transaction-scoped lock serializing version bookkeeping for one lesson
 * language. Without it, two overlapping autosaves both read "no open session"
 * (or the same open session) and each insert or extend independently, producing
 * duplicate sessions or letting the later-committing statement win with stale
 * content. Released automatically when the transaction ends.
 */
export async function lockBlockLocaleVersionSession(blockLocaleId: number, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    await client.execute(sql`select pg_advisory_xact_lock(hashtext(${`block_version:${blockLocaleId}`}))`);
  } catch (error) {
    console.error('lockBlockLocaleVersionSession error:', error);
    throw new Error(
      `Failed to lock block locale version session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/** Starts a new version session. */
export async function insertBlockLocaleVersion(
  data: TNewBlockLocaleHistory,
  dbClient?: DbOrTxClient
): Promise<TBlockLocaleHistory> {
  const client = dbClient ?? db;

  try {
    const [version] = await client.insert(schema.blockLocaleHistory).values(data).returning();
    if (!version) {
      throw new Error('Insert returned no row');
    }

    return version;
  } catch (error) {
    console.error('insertBlockLocaleVersion error:', error);
    throw new Error(
      `Failed to insert block locale version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Folds another save into an existing session: the row keeps its
 * `sessionStartedAt` (so the diff still spans the whole session) while its
 * content, end time, and edit count move forward.
 *
 * The session must still be an open autosave at update time. A publish or an
 * explicit save running in another transaction can seal it after the caller
 * read it, and rewriting a sealed snapshot would mutate the version students
 * were served. Returns null in that case so the caller opens a new session
 * instead.
 */
export async function extendBlockLocaleVersion(
  versionId: number,
  values: { newContent: string | null },
  dbClient?: DbOrTxClient
): Promise<TBlockLocaleHistory | null> {
  const client = dbClient ?? db;

  try {
    const [version] = await client
      .update(schema.blockLocaleHistory)
      .set({
        newContent: values.newContent,
        // Stamped by Postgres so it matches the frame of the column default.
        timestamp: sql`localtimestamp`,
        editCount: sql`${schema.blockLocaleHistory.editCount} + 1`
      })
      .where(
        and(
          eq(schema.blockLocaleHistory.id, versionId),
          eq(schema.blockLocaleHistory.kind, 'auto'),
          eq(schema.blockLocaleHistory.isSealed, false)
        )
      )
      .returning();

    return version ?? null;
  } catch (error) {
    console.error('extendBlockLocaleVersion error:', error);
    throw new Error(
      `Failed to extend block locale version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Upgrades an existing snapshot to a milestone and seals it. Used when the
 * author saves or publishes without having changed anything since the last
 * autosave — the row already holds the right content, it just needs the stronger
 * kind so retention keeps it.
 */
export async function promoteBlockLocaleVersion(
  versionId: number,
  values: { kind: TLessonVersionKind; label?: string | null },
  dbClient?: DbOrTxClient
): Promise<TBlockLocaleHistory> {
  const client = dbClient ?? db;

  try {
    const [version] = await client
      .update(schema.blockLocaleHistory)
      .set({
        kind: values.kind,
        label: values.label ?? null,
        isSealed: true
      })
      .where(eq(schema.blockLocaleHistory.id, versionId))
      .returning();

    if (!version) {
      throw new Error('Version not found');
    }

    return version;
  } catch (error) {
    console.error('promoteBlockLocaleVersion error:', error);
    throw new Error(
      `Failed to promote block locale version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Publish boundary. Marks the newest snapshot of every block locale in a
 * course as the published one and seals it, so the next autosave opens a fresh
 * session instead of rewriting the content students were served.
 *
 * @returns Number of snapshots sealed.
 */
export async function sealLatestBlockVersionsForCourse(courseId: string, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    const sealed = await client.execute(sql`
      WITH course_locales AS (
        SELECT DISTINCT bl.id
        FROM block_locale bl
        JOIN block_placement bp ON bp.block_id = bl.block_id
        JOIN lesson l ON l.id = bp.lesson_id
        WHERE l.course_id = ${courseId}
      ),
      latest AS (
        SELECT DISTINCT ON (bh.block_locale_id) bh.id
        FROM block_locale_history bh
        JOIN course_locales cl ON cl.id = bh.block_locale_id
        ORDER BY bh.block_locale_id, bh."timestamp" DESC, bh.id DESC
      )
      UPDATE block_locale_history h
      SET kind = 'publish', is_sealed = true
      FROM latest
      WHERE h.id = latest.id
      RETURNING h.id
    `);

    const created = await client.execute(sql`
      INSERT INTO block_locale_history (block_locale_id, new_content, kind, is_sealed)
      SELECT bl.id, bl.content, 'publish', true
      FROM block_locale bl
      WHERE bl.id IN (
          SELECT DISTINCT bl2.id
          FROM block_locale bl2
          JOIN block_placement bp ON bp.block_id = bl2.block_id
          JOIN lesson l ON l.id = bp.lesson_id
          WHERE l.course_id = ${courseId}
        )
        AND NOT EXISTS (
          SELECT 1 FROM block_locale_history h WHERE h.block_locale_id = bl.id
        )
      RETURNING id
    `);

    return sealed.length + created.length;
  } catch (error) {
    console.error('sealLatestBlockVersionsForCourse error:', error);
    throw new Error(
      `Failed to seal block versions for course: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets version history for a block and locale, newest first.
 *
 * `oldContent` is derived by the `block_versions` view from the preceding snapshot,
 * so a thinned history still diffs correctly: the jump is just wider.
 */
export async function getBlockVersionHistory(
  blockId: string,
  locale: string,
  limit: number,
  cursor?: TBlockVersionCursor
): Promise<TBlockVersionPage> {
  try {
    const olderThanCursor = cursor
      ? or(
          lt(schema.blockVersions.timestamp, cursor.timestamp),
          and(eq(schema.blockVersions.timestamp, cursor.timestamp), lt(schema.blockVersions.id, cursor.id))
        )
      : undefined;

    const rows = await db
      .select()
      .from(schema.blockVersions)
      .where(
        and(
          eq(schema.blockVersions.blockId, blockId),
          eq(schema.blockVersions.locale, locale as TBlockVersion['locale'] & string),
          olderThanCursor
        )
      )
      .orderBy(desc(schema.blockVersions.timestamp), desc(schema.blockVersions.id))
      .limit(limit + 1);

    if (rows.length > 0) {
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const last = items[items.length - 1];
      const canSeekPastLast = hasMore && last?.timestamp != null && last?.id != null;

      return {
        items,
        nextCursor: canSeekPastLast ? { timestamp: last.timestamp!, id: last.id! } : null
      };
    }

    if (cursor) {
      return { items: [], nextCursor: null };
    }

    const [currentLocale] = await db
      .select()
      .from(schema.blockLocale)
      .where(
        and(
          eq(schema.blockLocale.blockId, blockId),
          eq(schema.blockLocale.locale, locale as TBlockVersion['locale'] & string)
        )
      )
      .limit(1);

    if (!currentLocale) {
      return { items: [], nextCursor: null };
    }

    const now = new Date().toISOString();
    const currentVersion: TBlockVersion = {
      id: 0,
      oldContent: null,
      newContent: currentLocale.content,
      kind: 'auto',
      label: null,
      sessionStartedAt: now,
      timestamp: now,
      editCount: 1,
      isSealed: false,
      authorId: null,
      authorName: null,
      authorAvatarUrl: null,
      locale: currentLocale.locale,
      blockId: currentLocale.blockId
    };

    return { items: [currentVersion], nextCursor: null };
  } catch (error) {
    console.error('getBlockVersionHistory error:', error);
    throw new Error(`Failed to get block version history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Tiered thinning of autosave snapshots. Milestones (`manual`, `publish`) and the
 * newest snapshot of each block locale are never touched; everything else is
 * kept at decreasing resolution as it ages:
 *
 * - within `keepAllHours` — every snapshot
 * - within `hourlyDays`   — the last snapshot of each hour
 * - within `dailyDays`    — the last snapshot of each day
 * - older                 — deleted
 *
 * @returns Number of snapshots deleted.
 */
export async function pruneAutoBlockVersions(
  options: { keepAllHours: number; hourlyDays: number; dailyDays: number },
  dbClient?: DbOrTxClient
) {
  const client = dbClient ?? db;

  try {
    const rows = await client.execute(sql`
      WITH newest AS (
        SELECT DISTINCT ON (block_locale_id) id
        FROM block_locale_history
        ORDER BY block_locale_id, "timestamp" DESC, id DESC
      ),
      prunable AS (
        SELECT h.id,
               h."timestamp",
               row_number() OVER (
                 PARTITION BY h.block_locale_id, date_trunc('hour', h."timestamp")
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS hour_rank,
               row_number() OVER (
                 PARTITION BY h.block_locale_id, date_trunc('day', h."timestamp")
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS day_rank
        FROM block_locale_history h
        WHERE h.kind = 'auto'
          AND h.id NOT IN (SELECT id FROM newest)
          AND h."timestamp" < now() - make_interval(hours => ${options.keepAllHours})
      )
      DELETE FROM block_locale_history h
      USING prunable p
      WHERE h.id = p.id
        AND CASE
              WHEN p."timestamp" >= now() - make_interval(days => ${options.hourlyDays}) THEN p.hour_rank > 1
              WHEN p."timestamp" >= now() - make_interval(days => ${options.dailyDays}) THEN p.day_rank > 1
              ELSE true
            END
      RETURNING h.id
    `);

    return rows.length;
  } catch (error) {
    console.error('pruneAutoBlockVersions error:', error);
    throw new Error(`Failed to prune lesson versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hard cap on autosave snapshots per block locale, independent of age. Catches
 * pathological writers that would otherwise pile up thousands of rows before the
 * age-based tiers get a chance to thin them.
 *
 * @returns Number of snapshots deleted.
 */
export async function capAutoBlockVersionsPerLocale(maxPerLanguage: number, dbClient?: DbOrTxClient) {
  const client = dbClient ?? db;

  try {
    const rows = await client.execute(sql`
      WITH ranked AS (
        SELECT h.id,
               row_number() OVER (
                 PARTITION BY h.block_locale_id
                 ORDER BY h."timestamp" DESC, h.id DESC
               ) AS recency_rank
        FROM block_locale_history h
        WHERE h.kind = 'auto'
      )
      DELETE FROM block_locale_history h
      USING ranked r
      WHERE h.id = r.id
        AND r.recency_rank > ${maxPerLanguage}
      RETURNING h.id
    `);

    return rows.length;
  } catch (error) {
    console.error('capAutoBlockVersionsPerLocale error:', error);
    throw new Error(`Failed to cap lesson versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
