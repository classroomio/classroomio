import './../bootstrap';

import { Worker } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES, ZAudienceBulkActionPayload, createRedisConnection } from '@cio/jobs';
import { runQueuedAudienceBulkAction } from '@cio/core/services/organization/audience-bulk';

import { errorMessage } from '../utils/cancel';
import { log } from '../utils/logger';

const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.audience,
  async (job) => {
    if (job.name !== JOB_NAMES.audience.bulkAction) {
      throw new Error(`Unknown audience job: ${job.name}`);
    }

    const data = ZAudienceBulkActionPayload.parse(job.data ?? {});

    log.info('audience-bulk-action-start', {
      bullmqJobId: job.id,
      organizationId: data.organizationId,
      action: data.action,
      requested: data.memberIds.length
    });

    const result = await runQueuedAudienceBulkAction(data);

    log.info('audience-bulk-action-done', {
      bullmqJobId: job.id,
      action: data.action,
      requested: result.requested,
      succeeded: result.succeeded,
      failed: result.failed.length
    });

    // Returned as the job's completion value, so the status endpoint can hand
    // the client the same `completed` payload the synchronous path returns.
    return result;
  },
  // Serial: two concurrent lifecycle jobs for one org would race on the same
  // membership rows and on the plan's seat count.
  { connection, concurrency: 1 }
);

worker.on('ready', () => log.info('audience-worker-ready'));
worker.on('failed', (job, err) =>
  log.error('audience-job-failed', { jobName: job?.name, bullmqJobId: job?.id, error: errorMessage(err) })
);
worker.on('error', (err) => log.error('audience-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('audience-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
