import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { processSendEmail } from '../processors/emails';

const concurrency = Number.parseInt(env.EMAIL_WORKER_CONCURRENCY ?? '5', 10) || 5;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.emails,
  async (job) => {
    log.info('email-job-start', {
      jobName: job.name,
      bullmqJobId: job.id,
      attempt: job.attemptsMade + 1
    });

    switch (job.name) {
      case JOB_NAMES.emails.send:
        return processSendEmail(job.data);
      default:
        throw new Error(`Unknown emails job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('email-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  // BullMQ exhausted retries — write a dead-letter row so an operator can
  // inspect the payload + error and replay if needed.
  await recordDeadLetterJob({
    organizationId: null,
    domain: 'emails',
    runId: null,
    queueName: QUEUE_NAMES.emails,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('email-worker-ready', { concurrency, queue: QUEUE_NAMES.emails }));
worker.on('error', (err) => log.error('email-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('email-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
