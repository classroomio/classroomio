import {
  listPendingReminderDeliveries,
  listStaleQueuedReminderDeliveries,
  listUpcomingLiveSessionLessons,
  listUpcomingSessionsForReminderScan,
  markReminderDeliveriesSkipped,
  markReminderDeliveryQueued,
  markReminderDeliverySent,
  recordReminderDeliveryFailure,
  releaseReminderDeliveryClaim,
  settlePendingReminderDelivery,
  skipPastPendingReminderDeliveries,
  upsertPendingReminderDeliveries,
  type PendingReminderDeliveryInput,
  type UpcomingLiveSessionLesson,
  type UpcomingSessionReminderRow
} from '@cio/db/queries/course';
import { EmailPreferenceLookupCache } from '@cio/db/queries/notifications';
import { buildEmailBranding, buildEmailFromName, buildSessionIcs } from '@cio/email';
import { QUEUE_NAMES, enqueueEmailSend, getQueueJobEnvelope, toEmailJobId } from '@cio/jobs';
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
  staleClaimsReconciled: number;
}

type PendingDelivery = Awaited<ReturnType<typeof listPendingReminderDeliveries>>[number];

const MINUTE_MS = 60_000;

const HORIZON_BUFFER_MINUTES = 60;

const SEND_WINDOW_GRACE_MINUTES = 45;

const STALE_CLAIM_MINUTES = 15;

const STALE_CLAIM_BATCH_SIZE = 200;

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

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function getEmailJobOutcome(bullmqJobId: string) {
  const envelope = await getQueueJobEnvelope(QUEUE_NAMES.emails, bullmqJobId, 'emails');
  if (!envelope) return null;

  const providerId = typeof envelope.job.result?.providerId === 'string' ? envelope.job.result.providerId : null;

  return { status: envelope.job.status, providerId, error: envelope.job.error?.message ?? null };
}

/**
 * Settles queued rows whose email job finished without updating the ledger, and returns rows whose job never
 * reached the queue to pending. Returns how many rows changed.
 */
async function reconcileStaleClaims(now: number): Promise<number> {
  const queuedBefore = new Date(now - STALE_CLAIM_MINUTES * MINUTE_MS).toISOString();
  const staleDeliveries = await listStaleQueuedReminderDeliveries(queuedBefore, STALE_CLAIM_BATCH_SIZE);
  let reconciled = 0;

  for (const delivery of staleDeliveries) {
    if (!delivery.bullmqJobId) continue;

    const claim = { deliveryId: delivery.id, bullmqJobId: delivery.bullmqJobId };
    const outcome = await getEmailJobOutcome(delivery.bullmqJobId);

    if (!outcome) {
      await releaseReminderDeliveryClaim({ ...claim, lastError: 'Email job was not found in the queue' });
    } else if (outcome.status === 'completed') {
      await markReminderDeliverySent(claim.deliveryId, claim.bullmqJobId, outcome.providerId ?? '');
    } else if (outcome.status === 'failed') {
      const lastError = outcome.error ?? 'Email job failed';
      await recordReminderDeliveryFailure({ ...claim, lastError, isFinalAttempt: true });
    } else {
      continue;
    }

    reconciled += 1;
  }

  return reconciled;
}

/**
 * Reminder emails enqueued before the delivery ledger existed used a job id per (lesson, student, offset). When such
 * a job exists, records its outcome on the pending row instead of sending again. Returns true when it did.
 */
async function settleFromLegacyJob(delivery: PendingDelivery): Promise<boolean> {
  const legacyJobId = toEmailJobId(
    `session-reminder:${delivery.lessonId}:${delivery.profileId}:${delivery.offsetMinutes}`
  );
  const outcome = await getEmailJobOutcome(legacyJobId);
  if (!outcome) return false;

  const isFailed = outcome.status === 'failed';
  await settlePendingReminderDelivery({
    deliveryId: delivery.id,
    outcome: isFailed ? 'failed' : 'sent',
    providerId: outcome.providerId,
    lastError: isFailed ? outcome.error : null
  });

  return true;
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
  const staleClaimsReconciled = await reconcileStaleClaims(now);

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
    const deliveryIds = skippedByReason.get(reason);
    if (deliveryIds) {
      deliveryIds.push(deliveryId);
    } else {
      skippedByReason.set(reason, [deliveryId]);
    }
  };

  const preferenceCache = new EmailPreferenceLookupCache();
  const deliveryLocales = new Map<string, EmailLocale>();

  for (const delivery of dueDeliveries) {
    const recipient = recipientByKey.get(deliveryKey(delivery.lessonId, delivery.profileId));
    const offsets = offsetsByLesson.get(delivery.lessonId);
    const dueDelivery = resolveDueDelivery({ delivery, recipient, offsets, now });

    if ('skipReason' in dueDelivery) {
      skip(dueDelivery.skipReason, delivery.id);
      continue;
    }

    const sendable = dueDelivery.recipient;

    try {
      if (await settleFromLegacyJob(delivery)) continue;

      const allowed = await preferenceCache.shouldSend({
        emailId: 'sessionReminder',
        organizationId: sendable.organizationId,
        recipientEmail: sendable.email,
        recipientProfileId: sendable.profileId
      });

      if (!allowed) {
        skip('preferences', delivery.id);
        continue;
      }

      let locale = deliveryLocales.get(sendable.organizationId);
      if (!locale) {
        locale = await getStudentEmailDeliveryLocale(sendable.organizationId, 'sessionReminder');
        deliveryLocales.set(sendable.organizationId, locale);
      }

      const enqueued = await enqueueReminder({ ...dueDelivery, locale, now });
      if (enqueued) remindersEnqueued += 1;
    } catch (error) {
      log.error('session-reminder-enqueue-failed', {
        reminderDeliveryId: delivery.id,
        lessonId: delivery.lessonId,
        offset: delivery.offsetMinutes,
        error: errorText(error)
      });
    }
  }

  let remindersSkipped = 0;
  for (const [reason, deliveryIds] of skippedByReason) {
    await markReminderDeliveriesSkipped(deliveryIds, reason);
    remindersSkipped += deliveryIds.length;
  }

  const result = { scanned: recipients.length, remindersEnqueued, remindersSkipped, staleClaimsReconciled };
  log.info('session-reminder-scan-done', result);

  return result;
}

/**
 * Claims the delivery row for this session snapshot, then enqueues its email. Returns false when the row was already
 * claimed or the session changed since the scan read it.
 */
async function enqueueReminder(params: SendableDelivery & { locale: EmailLocale; now: number }): Promise<boolean> {
  const { delivery, recipient, offsets, locale, now } = params;
  const idempotencyKey = `session-reminder:${delivery.id}:${now}`;
  const bullmqJobId = toEmailJobId(idempotencyKey);

  const claim = { deliveryId: delivery.id, bullmqJobId };
  const claimed = await markReminderDeliveryQueued({
    ...claim,
    lessonAt: recipient.lessonAt,
    callUrl: recipient.callUrl
  });
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
  const from = buildEmailFromName(`${recipient.organizationName} (via ClassroomIO.com)`);

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
        from,
        organizationId: recipient.organizationId,
        locale,
        reminderDeliveryId: delivery.id,
        ...(ics ? { ics } : {})
      },
      { idempotencyKey }
    );
  } catch (error) {
    await releaseReminderDeliveryClaim({ ...claim, lastError: errorText(error) });
    throw error;
  }

  return true;
}
