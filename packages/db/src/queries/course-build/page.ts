import * as schema from '@db/schema';

import { asc, eq } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourseBuildPage, TNewCourseBuildPage } from '@db/types';

const INSERT_CHUNK = 200;

/** Replaces a source's stored pages, so a read that is retried never leaves the pages of an earlier attempt behind. */
export async function replaceCourseBuildSourcePages(
  sourceId: string,
  rows: TNewCourseBuildPage[],
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    const write = async (client: DbOrTxClient) => {
      await client.delete(schema.courseBuildPage).where(eq(schema.courseBuildPage.sourceId, sourceId));
      for (let start = 0; start < rows.length; start += INSERT_CHUNK)
        await client.insert(schema.courseBuildPage).values(rows.slice(start, start + INSERT_CHUNK));
    };

    if (dbClient === db) await db.transaction(write);
    else await write(dbClient);
  } catch (error) {
    console.error('replaceCourseBuildSourcePages error:', error);
    throw new Error('Failed to store course build pages');
  }
}

/** A job's pages, source by source in discovery order, each source's pages in reading order. */
export async function listCourseBuildPages(jobId: string, dbClient: DbOrTxClient = db): Promise<TCourseBuildPage[]> {
  try {
    const rows = await dbClient
      .select({ page: schema.courseBuildPage })
      .from(schema.courseBuildPage)
      .innerJoin(schema.courseBuildSource, eq(schema.courseBuildSource.id, schema.courseBuildPage.sourceId))
      .where(eq(schema.courseBuildPage.jobId, jobId))
      .orderBy(asc(schema.courseBuildSource.position), asc(schema.courseBuildPage.position));

    return rows.map((row) => row.page);
  } catch (error) {
    console.error('listCourseBuildPages error:', error);
    throw new Error('Failed to list course build pages');
  }
}

/** Stores the understand stage's page cards, by page row id. */
export async function setCourseBuildPageCards(
  cards: Array<{ pageRowId: string; card: Record<string, unknown> }>,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    const write = async (client: DbOrTxClient) => {
      for (const { pageRowId, card } of cards)
        await client.update(schema.courseBuildPage).set({ card }).where(eq(schema.courseBuildPage.id, pageRowId));
    };

    if (dbClient === db) await db.transaction(write);
    else await write(dbClient);
  } catch (error) {
    console.error('setCourseBuildPageCards error:', error);
    throw new Error('Failed to store course build page cards');
  }
}
