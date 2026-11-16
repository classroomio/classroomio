import * as schema from '@db/schema';

import { and, db, eq, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/** Marks a thread read for one person as of now. */
export async function upsertCourseCommentThreadRead(
  threadId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  const now = new Date().toISOString();

  try {
    await dbClient
      .insert(schema.courseCommentThreadRead)
      .values({ threadId, profileId, lastReadAt: now })
      .onConflictDoUpdate({
        target: [schema.courseCommentThreadRead.threadId, schema.courseCommentThreadRead.profileId],
        set: { lastReadAt: now }
      });
  } catch (error) {
    console.error('upsertCourseCommentThreadRead error:', error);
    throw new Error(`Failed to mark thread "${threadId}" read: ${errorMessage(error)}`);
  }
}

/** Marks every open thread of a course read for one person as of now. */
export async function markAllCourseCommentThreadsRead(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<void> {
  try {
    await dbClient.execute(sql`
      insert into ${schema.courseCommentThreadRead} (thread_id, profile_id, last_read_at)
      select thread.id, ${profileId}, now()
      from ${schema.courseCommentThread} thread
      where thread.course_id = ${courseId} and thread.status = 'open'
      on conflict (thread_id, profile_id) do update set last_read_at = excluded.last_read_at
    `);
  } catch (error) {
    console.error('markAllCourseCommentThreadsRead error:', error);
    throw new Error(`Failed to mark course "${courseId}" comments read: ${errorMessage(error)}`);
  }
}

export async function getCourseCommentThreadReadAt(
  threadId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await dbClient
      .select({ lastReadAt: schema.courseCommentThreadRead.lastReadAt })
      .from(schema.courseCommentThreadRead)
      .where(
        and(
          eq(schema.courseCommentThreadRead.threadId, threadId),
          eq(schema.courseCommentThreadRead.profileId, profileId)
        )
      )
      .limit(1);

    return row?.lastReadAt ?? null;
  } catch (error) {
    console.error('getCourseCommentThreadReadAt error:', error);
    throw new Error(`Failed to read thread state: ${errorMessage(error)}`);
  }
}
