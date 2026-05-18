import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob, updateMediaJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';

import { JobCanceledError, errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { processExtractAudio, processGenerateThumbnail, processProbeMetadata } from '../processors/media';

const concurrency = Number.parseInt(env.MEDIA_WORKER_CONCURRENCY ?? '2', 10) || 2;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.media,
  async (job) => {
    log.info('media-job-start', { jobName: job.name, bullmqJobId: job.id, attempt: job.attemptsMade + 1 });

    switch (job.name) {
      case JOB_NAMES.media.probeMetadata:
        return processProbeMetadata(job.data);
      case JOB_NAMES.media.generateThumbnail:
        return processGenerateThumbnail(job.data);
      case JOB_NAMES.media.extractAudio:
        return processExtractAudio(job.data);
      default:
        throw new Error(`Unknown media job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  if (err instanceof JobCanceledError) {
    log.warn('media-job-canceled', { jobName: job.name, bullmqJobId: job.id });
    await updateMediaJob(err.mediaJobId, {
      status: 'canceled',
      stage: 'canceled',
      error: { code: 'CANCELED', message: 'Run canceled by user' }
    });
    return;
  }

  log.error('media-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  const data = job.data as { mediaJobId?: string; assetId?: string; actorContext?: { organizationId?: string } };
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
    queueName: QUEUE_NAMES.media,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('media-worker-ready', { concurrency, queue: QUEUE_NAMES.media }));
worker.on('error', (err) => log.error('media-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('media-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
