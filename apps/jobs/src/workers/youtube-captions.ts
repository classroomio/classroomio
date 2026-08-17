import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob, updateMediaJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection, ZFetchYoutubeCaptionsPayload } from '@cio/jobs';

import { JobCanceledError, errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { processFetchYoutubeCaptions } from '../processors/youtube-captions/fetch-captions';

const concurrency = 1;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.youtubeCaptions,
  async (job) => {
    log.info('youtube-captions-job-start', { jobName: job.name, bullmqJobId: job.id, attempt: job.attemptsMade + 1 });

    if (job.name === JOB_NAMES.youtubeCaptions.fetchCaptions) {
      const parsed = ZFetchYoutubeCaptionsPayload.safeParse(job.data);
      if (!parsed.success) {
        throw new Error(`Invalid youtube-captions payload: ${parsed.error.message}`);
      }
      return processFetchYoutubeCaptions(parsed.data);
    }

    throw new Error(`Unknown youtube-captions job: ${job.name}`);
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  if (err instanceof JobCanceledError) {
    log.warn('youtube-captions-job-canceled', { jobName: job.name, bullmqJobId: job.id });
    await updateMediaJob(err.mediaJobId, {
      status: 'canceled',
      stage: 'canceled',
      error: { code: 'CANCELED', message: 'Run canceled by user' }
    });
    return;
  }

  log.error('youtube-captions-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  const data = job.data as { mediaJobId?: string; organizationId?: string };
  if (data?.mediaJobId) {
    await updateMediaJob(data.mediaJobId, {
      status: 'failed',
      stage: 'failed',
      error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err) }
    });
  }

  await recordDeadLetterJob({
    organizationId: data?.organizationId ?? null,
    domain: 'youtube-captions',
    runId: data?.mediaJobId ?? null,
    queueName: QUEUE_NAMES.youtubeCaptions,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () =>
  log.info('youtube-captions-worker-ready', { concurrency, queue: QUEUE_NAMES.youtubeCaptions })
);
worker.on('error', (err) => log.error('youtube-captions-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('youtube-captions-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
