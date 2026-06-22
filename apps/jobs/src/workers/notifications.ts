import './../bootstrap';

import { Queue, Worker } from 'bullmq';

import { recordDeadLetterJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import {
  processNotifyCourseExercise,
  processNotifyCourseSessionUpdate,
  processSessionReminderScan
} from '../processors/notifications';

const concurrency = Number.parseInt(env.EMAIL_WORKER_CONCURRENCY ?? '5', 10) || 5;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.notifications,
  async (job) => {
    log.info('notification-job-start', {
      jobName: job.name,
      bullmqJobId: job.id,
      attempt: job.attemptsMade + 1
    });

    switch (job.name) {
      case JOB_NAMES.notifications.notifyCourseExercise:
        return processNotifyCourseExercise(job.data, String(job.id));
      case JOB_NAMES.notifications.sessionReminderScan:
        return processSessionReminderScan();
      case JOB_NAMES.notifications.notifyCourseSessionUpdate:
        return processNotifyCourseSessionUpdate(job.data);
      default:
        throw new Error(`Unknown notifications job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

// Repeatable scheduler: run the session-reminder scan every 15 minutes.
const SESSION_REMINDER_SCAN_INTERVAL_MS = 15 * 60 * 1_000;
const schedulerConnection = createRedisConnection();
const notificationsQueue = new Queue(QUEUE_NAMES.notifications, { connection: schedulerConnection });

async function registerSchedulers(): Promise<void> {
  try {
    await notificationsQueue.upsertJobScheduler(
      'session-reminder-scan-scheduler',
      { every: SESSION_REMINDER_SCAN_INTERVAL_MS },
      { name: JOB_NAMES.notifications.sessionReminderScan, data: {} }
    );
    log.info('session-reminder-scan-scheduler-registered', { everyMs: SESSION_REMINDER_SCAN_INTERVAL_MS });
  } catch (err) {
    log.error('session-reminder-scan-scheduler-register-failed', { error: errorMessage(err) });
  }
}

void registerSchedulers();

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('notification-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  await recordDeadLetterJob({
    organizationId: null,
    domain: 'notifications',
    runId: null,
    queueName: QUEUE_NAMES.notifications,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('notifications-worker-ready'));
worker.on('error', (err) => log.error('notifications-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('notifications-worker-shutdown', { signal });
  await worker.close();
  await notificationsQueue.close();
  await schedulerConnection.quit();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
