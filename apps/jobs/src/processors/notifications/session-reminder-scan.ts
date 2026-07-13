import { listUpcomingSessionsForReminderScan } from '@cio/db/queries/course';
import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { buildEmailBranding, buildEmailFromName, buildSessionIcs } from '@cio/email';
import { enqueueEmailSend } from '@cio/jobs';

import { log } from '../../utils/logger';

interface ScanResult {
  scanned: number;
  remindersEnqueued: number;
}

const OFFSETS_MINUTES = [1440, 60] as const;

function formatSessionTime(lessonAt: string, timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone ?? 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short'
    }).format(new Date(lessonAt));
  } catch {
    return new Date(lessonAt).toUTCString();
  }
}

/**
 * Scan upcoming live sessions and enqueue 24h / 1h reminder emails to enrolled
 * students. Idempotency key per (lesson, student, offset) so each reminder
 * fires once (BullMQ dedupes on jobId). The 24h reminder also carries an .ics.
 */
export async function processSessionReminderScan(): Promise<ScanResult> {
  const rows = await listUpcomingSessionsForReminderScan();
  const now = Date.now();

  let remindersEnqueued = 0;
  const preferenceCache = new EmailPreferenceLookupCache();

  for (const row of rows) {
    if (!row.email) continue;

    const startMs = new Date(row.lessonAt).getTime();
    if (Number.isNaN(startMs)) continue;

    const minutesUntil = Math.round((startMs - now) / 60_000);
    if (minutesUntil <= 0) continue;

    const branding = buildEmailBranding({
      name: row.organizationName,
      avatarUrl: row.organizationAvatarUrl,
      theme: row.organizationTheme
    });
    const sessionTimeLabel = formatSessionTime(row.lessonAt, row.sessionTimezone);

    for (const offset of OFFSETS_MINUTES) {
      if (minutesUntil > offset) continue;

      const whenLabel = offset === 1440 ? 'in about 24 hours' : 'in about 1 hour';
      const ics =
        offset === 1440
          ? buildSessionIcs({
              uid: `session-${row.lessonId}@classroomio`,
              sequence: 0,
              method: 'PUBLISH',
              start: row.lessonAt,
              title: row.lessonTitle,
              description: `Join your live session: ${row.callUrl}`,
              url: row.callUrl,
              alarmsBeforeMinutes: [1440, 60]
            })
          : undefined;

      try {
        const allowed = await preferenceCache.shouldSend({
          emailId: 'sessionReminder',
          organizationId: row.organizationId,
          recipientEmail: row.email,
          recipientProfileId: row.profileId
        });

        if (!allowed) {
          continue;
        }

        await enqueueEmailSend(
          {
            kind: 'template',
            template: 'sessionReminder',
            to: row.email,
            fields: {
              orgName: row.organizationName,
              courseName: row.courseName,
              sessionTitle: row.lessonTitle,
              sessionTimeLabel,
              whenLabel,
              joinUrl: row.callUrl,
              branding
            },
            from: buildEmailFromName(`${row.organizationName} (via ClassroomIO.com)`),
            ...(ics ? { ics } : {})
          },
          { idempotencyKey: `session-reminder:${row.lessonId}:${row.profileId}:${offset}` }
        );
        remindersEnqueued += 1;
      } catch (error) {
        log.error('session-reminder-enqueue-failed', { lessonId: row.lessonId, offset });
      }
    }
  }

  log.info('session-reminder-scan-done', { scanned: rows.length, remindersEnqueued });

  return { scanned: rows.length, remindersEnqueued };
}
