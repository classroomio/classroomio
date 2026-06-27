import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TNotifyCourseExercisePayload, TNotifyCourseSessionUpdatePayload } from '../payloads/notifications';

/**
 * Enqueue a `notifications:notify-course-exercise` job. Returns the BullMQ
 * job id so the dashboard can poll its status. Each click is a fresh nudge,
 * so we do NOT set a stable jobId (no dedupe across clicks).
 */
export async function enqueueNotifyCourseExercise(
  payload: TNotifyCourseExercisePayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.notifications).add(JOB_NAMES.notifications.notifyCourseExercise, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.notifications],
    ...options
  });

  return job.id;
}

/** Enqueue a one-off run of the session-reminder scan (manual trigger / on-demand). */
export async function enqueueSessionReminderScan(options: JobsOptions = {}): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.notifications).add(
    JOB_NAMES.notifications.sessionReminderScan,
    {},
    { ...QUEUE_DEFAULTS[QUEUE_NAMES.notifications], ...options }
  );

  return job.id;
}

/** Enqueue a "session updated" notification that emails members an updated calendar invite. */
export async function enqueueNotifyCourseSessionUpdate(
  payload: TNotifyCourseSessionUpdatePayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const job = await getQueue(QUEUE_NAMES.notifications).add(
    JOB_NAMES.notifications.notifyCourseSessionUpdate,
    payload,
    {
      ...QUEUE_DEFAULTS[QUEUE_NAMES.notifications],
      ...options
    }
  );

  return job.id;
}
