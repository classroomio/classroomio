import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob, updateMediaJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';

import { JobCanceledError, errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { processHlsEncode } from '../processors/media';

const concurrency = Number.parseInt(env.HLS_WORKER_CONCURRENCY ?? '1', 10) || 1;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.mediaHls,
  async (job) => {
    log.info('hls-job-start', { jobName: job.name, bullmqJobId: job.id, attempt: job.attemptsMade + 1 });

    if (job.name === JOB_NAMES.mediaHls.hlsEncode) {
      return processHlsEncode(job.data);
    }

    throw new Error(`Unknown hls job: ${job.name}`);
  },
  { connection, concurrency, lockDuration: 120_000 }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  if (err instanceof JobCanceledError) {
    log.warn('hls-job-canceled', { jobName: job.name, bullmqJobId: job.id });
    await updateMediaJob(err.mediaJobId, {
      status: 'canceled',
      stage: 'canceled',
      error: { code: 'CANCELED', message: 'Run canceled by user' }
    });
    return;
  }

  log.error('hls-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  const data = job.data as { mediaJobId?: string; actorContext?: { organizationId?: string } };
  if (data?.mediaJobId) {
    await updateMediaJob(data.mediaJobId, {
      status: 'failed',
      stage: 'failed',
      error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err) }
    });
  }

  await recordDeadLetterJob({
    organizationId: data?.actorContext?.organizationId ?? null,
    domain: 'media',
    runId: data?.mediaJobId ?? null,
    queueName: QUEUE_NAMES.mediaHls,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('hls-worker-ready', { concurrency, queue: QUEUE_NAMES.mediaHls }));
worker.on('error', (err) => log.error('hls-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('hls-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
