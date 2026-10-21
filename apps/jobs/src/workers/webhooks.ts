import './../bootstrap';

import { Worker } from 'bullmq';

import { processWebhookEndpoint } from '@cio/core/services/webhook/deliver';
import { recordDeadLetterJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, ZDeliverWebhookPayload, createRedisConnection } from '@cio/jobs';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';

const concurrency = Number.parseInt(env.WEBHOOK_WORKER_CONCURRENCY ?? '10', 10) || 10;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.webhooks,
  async (job) => {
    switch (job.name) {
      case JOB_NAMES.webhooks.deliver: {
        const { webhookId } = ZDeliverWebhookPayload.parse(job.data);
        const result = await processWebhookEndpoint(webhookId);

        log.info('webhook-job-done', { bullmqJobId: job.id, webhookId, processed: result.processed });

        return result;
      }
      default:
        throw new Error(`Unknown webhooks job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('webhook-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  await recordDeadLetterJob({
    organizationId: null,
    domain: 'webhooks',
    runId: null,
    queueName: QUEUE_NAMES.webhooks,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('webhook-worker-ready', { concurrency, queue: QUEUE_NAMES.webhooks }));
worker.on('error', (err) => log.error('webhook-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('webhook-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
