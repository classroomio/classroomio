import { deleteScormSessionEventsOlderThan } from '@cio/db/queries/scorm/session-event';

export interface ScormRetentionResult {
  eventsDeleted: number;
  versionsDeleted: number;
  versionsArchived: number;
  objectsDeleted: number;
}

function cutoffIso(days: number, nowMs: number): string {
  return new Date(nowMs - days * 86_400_000).toISOString();
}

/**
 * Deletes diagnostic events past their window. Replaced package files stay in
 * storage until an admin deletes the package, matching other asset kinds.
 */
export async function runScormRetention(
  eventOlderThanDays = 90,
  nowMs: number = Date.now()
): Promise<ScormRetentionResult> {
  const eventsDeleted = await deleteScormSessionEventsOlderThan(cutoffIso(eventOlderThanDays, nowMs));

  return { eventsDeleted, versionsDeleted: 0, versionsArchived: 0, objectsDeleted: 0 };
}
