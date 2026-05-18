import './../bootstrap';

import { Worker } from 'bullmq';

import { pruneDeadLetterJobsOlderThan } from '@cio/db/queries';
import {
  JOB_NAMES,
  QUEUE_NAMES,
  ZDeadLetterCleanupPayload,
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

    throw new Error(`Unknown maintenance job: ${job.name}`);
  },
  { connection, concurrency: 1 }
);

worker.on('ready', () => log.info('maintenance-worker-ready'));
worker.on('failed', (job, err) =>
  log.error('maintenance-job-failed', { jobName: job?.name, error: errorMessage(err) })
);
worker.on('error', (err) => log.error('maintenance-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('maintenance-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
