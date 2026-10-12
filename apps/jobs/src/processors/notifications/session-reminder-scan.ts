import {
  listPendingReminderDeliveries,
  listUpcomingLiveSessionLessons,
  listUpcomingSessionsForReminderScan,
  markReminderDeliveriesSkipped,
  markReminderDeliveryQueued,
  releaseReminderDeliveryClaim,
  skipPastPendingReminderDeliveries,
  upsertPendingReminderDeliveries,
  type PendingReminderDeliveryInput,
  type UpcomingLiveSessionLesson,
  type UpcomingSessionReminderRow
} from '@cio/db/queries/course';
import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { buildEmailBranding, buildEmailFromName, buildSessionIcs } from '@cio/email';
import { enqueueEmailSend, toEmailJobId } from '@cio/jobs';
import {
  LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES,
  resolveLiveSessionReminderOffsets,
  type TLiveSessionReminderSkipReason
} from '@cio/utils/constants';

import { log } from '../../utils/logger';
import { getStudentEmailDeliveryLocale } from '@cio/core/services/email/localization';
import type { EmailLocale } from '@cio/utils/email';

interface ScanResult {
  scanned: number;
  remindersEnqueued: number;
  remindersSkipped: number;
}

type PendingDelivery = Awaited<ReturnType<typeof listPendingReminderDeliveries>>[number];

const MINUTE_MS = 60_000;

const HORIZON_BUFFER_MINUTES = 60;

const SEND_WINDOW_GRACE_MINUTES = 45;

function formatSessionTime(lessonAt: string, timezone: string | null, locale: EmailLocale): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone ?? 'UTC',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(lessonAt));
  } catch {
    return new Date(lessonAt).toUTCString();
  }
}

function formatWhenLabel(offsetMinutes: number, locale: EmailLocale): string {
  const relativeTime = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });

  if (offsetMinutes % 1440 === 0) return relativeTime.format(offsetMinutes / 1440, 'day');
  if (offsetMinutes % 60 === 0) return relativeTime.format(offsetMinutes / 60, 'hour');

  return relativeTime.format(offsetMinutes, 'minute');
}

function deliveryKey(lessonId: string, profileId: string): string {
  return `${lessonId}:${profileId}`;
}

function lessonsWithinReminderHorizon(lessons: UpcomingLiveSessionLesson[], now: number) {
  const offsetsByLesson = new Map<string, number[]>();

  for (const lesson of lessons) {
    const offsets = resolveLiveSessionReminderOffsets(lesson.reminderOffsetsMinutes);
    if (offsets.length === 0) continue;

    const minutesUntil = (new Date(lesson.lessonAt).getTime() - now) / MINUTE_MS;
    const horizonMinutes = Math.max(...offsets) + HORIZON_BUFFER_MINUTES;
    if (minutesUntil > horizonMinutes) continue;

    offsetsByLesson.set(lesson.lessonId, offsets);
  }

  return offsetsByLesson;
}

function buildPendingInputs(
  recipients: UpcomingSessionReminderRow[],
  offsetsByLesson: Map<string, number[]>
): PendingReminderDeliveryInput[] {
  return recipients.flatMap((recipient) =>
    (offsetsByLesson.get(recipient.lessonId) ?? []).map((offsetMinutes) => ({
      organizationId: recipient.organizationId,
      courseId: recipient.courseId,
      lessonId: recipient.lessonId,
      profileId: recipient.profileId,
      offsetMinutes,
      lessonAt: recipient.lessonAt
    }))
  );
}

type SendableDelivery = {
  delivery: PendingDelivery;
  recipient: UpcomingSessionReminderRow & { email: string };
  offsets: number[];
};

/**
 * The delivery with everything needed to send it now, or the reason it must be skipped.
 */
function resolveDueDelivery(params: {
  delivery: PendingDelivery;
  recipient: UpcomingSessionReminderRow | undefined;
  offsets: number[] | undefined;
  now: number;
}): SendableDelivery | { skipReason: TLiveSessionReminderSkipReason } {
  const { delivery, recipient, offsets, now } = params;
  const lessonAtMs = new Date(delivery.lessonAt).getTime();
  const dueAtMs = lessonAtMs - delivery.offsetMinutes * MINUTE_MS;

  if (!offsets?.includes(delivery.offsetMinutes)) return { skipReason: 'offset_removed' };
  if (!recipient) return { skipReason: 'unenrolled' };
  if (now >= lessonAtMs) return { skipReason: 'lesson_past' };
  if (now > dueAtMs + SEND_WINDOW_GRACE_MINUTES * MINUTE_MS) return { skipReason: 'window_passed' };
  if (!recipient.email) return { skipReason: 'no_email' };

  return { delivery, recipient: { ...recipient, email: recipient.email }, offsets };
}

function isDue(delivery: PendingDelivery, now: number): boolean {
  const dueAtMs = new Date(delivery.lessonAt).getTime() - delivery.offsetMinutes * MINUTE_MS;

  return now >= dueAtMs;
}

/**
 * Scan upcoming live sessions, record one ledger row per (session × student × course reminder offset), and enqueue
 * the reminder emails that are due. The earliest reminder of each session also carries an .ics invite.
 */
export async function processSessionReminderScan(): Promise<ScanResult> {
  const now = Date.now();

  await skipPastPendingReminderDeliveries(new Date(now).toISOString());

  const until = new Date(now + (LIVE_SESSION_REMINDER_MAX_OFFSET_MINUTES + HORIZON_BUFFER_MINUTES) * MINUTE_MS);
  const lessons = await listUpcomingLiveSessionLessons(until);
  const offsetsByLesson = lessonsWithinReminderHorizon(lessons, now);
  const lessonIds = [...offsetsByLesson.keys()];

  const recipients = await listUpcomingSessionsForReminderScan(lessonIds);
  await upsertPendingReminderDeliveries(buildPendingInputs(recipients, offsetsByLesson));

  const recipientByKey = new Map(
    recipients.map((recipient) => [deliveryKey(recipient.lessonId, recipient.profileId), recipient])
  );
  const pendingDeliveries = await listPendingReminderDeliveries(lessonIds);
  const dueDeliveries = pendingDeliveries.filter((delivery) => isDue(delivery, now));

  let remindersEnqueued = 0;
  const skippedByReason = new Map<TLiveSessionReminderSkipReason, string[]>();
  const skip = (reason: TLiveSessionReminderSkipReason, deliveryId: string) => {
    skippedByReason.set(reason, [...(skippedByReason.get(reason) ?? []), deliveryId]);
  };

  const preferenceCache = new EmailPreferenceLookupCache();
  const deliveryLocales = new Map<string, EmailLocale>();

  for (const delivery of dueDeliveries) {
    const dueDelivery = resolveDueDelivery({
      delivery,
      recipient: recipientByKey.get(deliveryKey(delivery.lessonId, delivery.profileId)),
      offsets: offsetsByLesson.get(delivery.lessonId),
      now
    });

    if ('skipReason' in dueDelivery) {
      skip(dueDelivery.skipReason, delivery.id);
      continue;
    }

    const { recipient } = dueDelivery;

    try {
      const allowed = await preferenceCache.shouldSend({
        emailId: 'sessionReminder',
        organizationId: recipient.organizationId,
        recipientEmail: recipient.email,
        recipientProfileId: recipient.profileId
      });

      if (!allowed) {
        skip('preferences', delivery.id);
        continue;
      }

      let locale = deliveryLocales.get(recipient.organizationId);
      if (!locale) {
        locale = await getStudentEmailDeliveryLocale(recipient.organizationId, 'sessionReminder');
        deliveryLocales.set(recipient.organizationId, locale);
      }

      const enqueued = await enqueueReminder({ ...dueDelivery, locale, now });
      if (enqueued) remindersEnqueued += 1;
    } catch (error) {
      log.error('session-reminder-enqueue-failed', {
        reminderDeliveryId: delivery.id,
        lessonId: delivery.lessonId,
        offset: delivery.offsetMinutes,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  let remindersSkipped = 0;
  for (const [reason, deliveryIds] of skippedByReason) {
    await markReminderDeliveriesSkipped(deliveryIds, reason);
    remindersSkipped += deliveryIds.length;
  }

  log.info('session-reminder-scan-done', {
    scanned: recipients.length,
    remindersEnqueued,
    remindersSkipped
  });

  return { scanned: recipients.length, remindersEnqueued, remindersSkipped };
}

/**
 * Claims the delivery row, then enqueues its email. Returns false when another scan already claimed the row.
 */
async function enqueueReminder(params: SendableDelivery & { locale: EmailLocale; now: number }): Promise<boolean> {
  const { delivery, recipient, offsets, locale, now } = params;
  const idempotencyKey = `session-reminder:${delivery.id}:${now}`;
  const bullmqJobId = toEmailJobId(idempotencyKey);

  const claimed = await markReminderDeliveryQueued(delivery.id, bullmqJobId);
  if (!claimed) return false;

  const branding = buildEmailBranding({
    name: recipient.organizationName,
    avatarUrl: recipient.organizationAvatarUrl,
    theme: recipient.organizationTheme
  });
  const sessionTimeLabel = formatSessionTime(recipient.lessonAt, recipient.sessionTimezone, locale);
  const whenLabel = formatWhenLabel(delivery.offsetMinutes, locale);
  const isEarliestReminder = delivery.offsetMinutes === Math.max(...offsets);
  const ics = isEarliestReminder
    ? buildSessionIcs({
        uid: `session-${recipient.lessonId}@classroomio`,
        sequence: 0,
        method: 'PUBLISH',
        start: recipient.lessonAt,
        title: recipient.lessonTitle,
        description: `Join your live session: ${recipient.callUrl}`,
        url: recipient.callUrl,
        alarmsBeforeMinutes: offsets
      })
    : undefined;

  try {
    await enqueueEmailSend(
      {
        kind: 'template',
        template: 'sessionReminder',
        to: recipient.email,
        fields: {
          orgName: recipient.organizationName,
          courseName: recipient.courseName,
          sessionTitle: recipient.lessonTitle,
          sessionTimeLabel,
          whenLabel,
          joinUrl: recipient.callUrl,
          branding
        },
        from: buildEmailFromName(`${recipient.organizationName} (via ClassroomIO.com)`),
        organizationId: recipient.organizationId,
        locale,
        reminderDeliveryId: delivery.id,
        ...(ics ? { ics } : {})
      },
      { idempotencyKey }
    );
  } catch (error) {
    await releaseReminderDeliveryClaim(delivery.id, error instanceof Error ? error.message : String(error));
    throw error;
  }

  return true;
}
