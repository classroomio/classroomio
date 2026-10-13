import * as schema from '@db/schema';

import { lt, sql } from '@db/drizzle';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TScormSessionEvent } from '@db/types';
import {
  SCORM_SESSION_EVENT_KINDS,
  ZScormSessionEventDetail,
  ZScormSessionEventUserAgent,
  type TScormSessionEventKind
} from '@cio/utils/validation/activity';

export type ScormSessionEventRow = {
  id: string;
  attemptId: string;
  unitId: string;
  kind: string;
  detail: Record<string, unknown>;
  createdAt: string;
};

/**
 * Records one diagnostic event for a module try. Returns the inserted row.
 */
export async function recordScormSessionEvent(
  scoAttemptId: string,
  kind: TScormSessionEventKind,
  detail: Record<string, unknown>,
  userAgent: string | null,
  dbClient: DbOrTxClient = db
): Promise<TScormSessionEvent> {
  if (!(SCORM_SESSION_EVENT_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Invalid SCORM session event kind "${kind}"`);
  }

  const detailResult = ZScormSessionEventDetail.safeParse(detail ?? {});
  if (!detailResult.success) {
    throw new Error(`SCORM session event detail exceeds 2 KB for try "${scoAttemptId}"`);
  }

  const userAgentResult = ZScormSessionEventUserAgent.safeParse(userAgent);
  if (!userAgentResult.success) {
    throw new Error(`SCORM session event user agent exceeds 512 characters for try "${scoAttemptId}"`);
  }

  try {
    const [row] = await dbClient
      .insert(schema.scormSessionEvent)
      .values({ scoAttemptId, kind, detail: detailResult.data, userAgent: userAgentResult.data ?? null })
      .returning();
    if (!row) throw new Error('Insert returned no row');

    return row;
  } catch (error) {
    console.error('recordScormSessionEvent error:', error);
    throw new Error(
      `Failed to record SCORM session event for try "${scoAttemptId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lists every diagnostic event of an activity and profile, tagged with the
 * attempt and unit of the try that produced it. Oldest first.
 */
export async function listScormSessionEventsByLearner(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<ScormSessionEventRow[]> {
  try {
    const result = await dbClient.execute(sql`
      SELECT e.id, a.id AS attempt_id, t.unit_id,
             e.kind, COALESCE(e.detail, '{}'::jsonb) AS detail, e.created_at
      FROM scorm_session_event e
      JOIN scorm_sco_attempt t ON t.id = e.sco_attempt_id
      JOIN scorm_attempt a ON a.id = t.attempt_id
      WHERE a.activity_id = ${activityId} AND a.profile_id = ${profileId}
      ORDER BY e.created_at ASC, e.id ASC`);

    return (result as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row['id']),
      attemptId: String(row['attempt_id']),
      unitId: String(row['unit_id']),
      kind: String(row['kind']),
      detail: (row['detail'] ?? {}) as Record<string, unknown>,
      createdAt: String(row['created_at'])
    }));
  } catch (error) {
    console.error('listScormSessionEventsByLearner error:', error);
    throw new Error(
      `Failed to list SCORM session events for activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes diagnostic events older than the cutoff. Returns the row count.
 */
export async function deleteScormSessionEventsOlderThan(
  cutoffIso: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const deleted = await dbClient
      .delete(schema.scormSessionEvent)
      .where(lt(schema.scormSessionEvent.createdAt, cutoffIso))
      .returning({ id: schema.scormSessionEvent.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteScormSessionEventsOlderThan error:', error);
    throw new Error(
      `Failed to delete SCORM session events older than "${cutoffIso}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
