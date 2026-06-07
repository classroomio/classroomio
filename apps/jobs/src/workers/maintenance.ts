import './../bootstrap';

import { Queue, Worker } from 'bullmq';

import { runAnalyticsRollupDaily } from '@cio/analytics';
import { pruneDeadLetterJobsOlderThan, reapStuckMediaJobs } from '@cio/db/queries';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  ZAnalyticsDailyRollupPayload,
  ZDeadLetterCleanupPayload,
  ZMediaJobReapPayload,
  ZRetentionCompactPayload,
  createRedisConnection
} from '@cio/jobs';

import { errorMessage } from '../utils/cancel';
import { log } from '../utils/logger';

const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.maintenance,
  async (job) => {
    if (job.name === JOB_NAMES.maintenance.deadLetterCleanup) {
      const data = ZDeadLetterCleanupPayload.parse(job.data ?? {});
      const cutoff = new Date(Date.now() - data.olderThanDays * 86_400 * 1_000).toISOString();
      const deleted = await pruneDeadLetterJobsOlderThan(cutoff);
      log.info('dead-letter-cleanup-done', { deleted, cutoff });
      return { deleted };
    }

    if (job.name === JOB_NAMES.maintenance.retentionCompact) {
      ZRetentionCompactPayload.parse(job.data ?? {});
      // Retention windows for media_job, job_step, email_delivery to be wired
      // alongside their respective queries. Logged for now so the schedule
      // is observable without silently dropping data.
      log.info('retention-compact-noop', { reason: 'not-yet-implemented' });
      return { compacted: 0 };
    }

    if (job.name === JOB_NAMES.maintenance.mediaJobReap) {
      const data = ZMediaJobReapPayload.parse(job.data ?? {});
      const cutoffIso = new Date(Date.now() - data.staleAfterMinutes * 60 * 1_000).toISOString();
      const reaped = await reapStuckMediaJobs(cutoffIso);

      if (reaped.length > 0) {
        log.warn('media-job-reap-done', {
          reaped: reaped.length,
          cutoffIso,
          ids: reaped.map((row) => row.id)
        });
      }

      return { reaped: reaped.length };
    }

    if (job.name === JOB_NAMES.maintenance.analyticsDailyRollup) {
      const data = ZAnalyticsDailyRollupPayload.parse(job.data ?? {});
      const result = await runAnalyticsRollupDaily({ daysAgo: data.daysAgo });
      log.info('analytics-rollup-done', result);
      return result;
    }

    throw new Error(`Unknown maintenance job: ${job.name}`);
  },
  { connection, concurrency: 1 }
);

/**
 * BullMQ repeatable scheduler for the media-job reaper. `upsertJobScheduler`
 * is idempotent on the scheduler id, so it's safe to call on every worker
 * boot. Without this, stuck `media_job` rows would never get cleaned up.
 */
const MEDIA_JOB_REAP_INTERVAL_MS = 5 * 60 * 1_000;
// BullMQ requires a dedicated connection per Worker; give the Queue its own
// so the scheduler upsert doesn't piggyback on the worker's blocking client.
const schedulerConnection = createRedisConnection();
const maintenanceQueue = new Queue(QUEUE_NAMES.maintenance, { connection: schedulerConnection });

async function registerSchedulers(): Promise<void> {
  try {
    await maintenanceQueue.upsertJobScheduler(
      'media-job-reap-scheduler',
      { every: MEDIA_JOB_REAP_INTERVAL_MS },
      { name: JOB_NAMES.maintenance.mediaJobReap, data: {} }
    );
    log.info('maintenance-scheduler-registered', {
      name: JOB_NAMES.maintenance.mediaJobReap,
      everyMs: MEDIA_JOB_REAP_INTERVAL_MS
    });

    await maintenanceQueue.upsertJobScheduler(
      'analytics-daily-rollup-scheduler',
      { every: 86_400_000 },
      { name: JOB_NAMES.maintenance.analyticsDailyRollup, data: {} }
    );
    log.info('analytics-rollup-scheduler-registered', {
      name: JOB_NAMES.maintenance.analyticsDailyRollup,
      everyMs: 86_400_000
    });
  } catch (err) {
    log.error('maintenance-scheduler-register-failed', { error: errorMessage(err) });
  }
}

void registerSchedulers();

worker.on('ready', () => log.info('maintenance-worker-ready'));
worker.on('failed', (job, err) =>
  log.error('maintenance-job-failed', { jobName: job?.name, error: errorMessage(err) })
);
worker.on('error', (err) => log.error('maintenance-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('maintenance-worker-shutdown', { signal });
  await worker.close();
  await maintenanceQueue.close();
  await schedulerConnection.quit();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
