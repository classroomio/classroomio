import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, ZOnboardingStarterPayload, createRedisConnection } from '@cio/jobs';
import { runStarterJob } from '@cio/core';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';

const concurrency = Number.parseInt(env.ONBOARDING_STARTER_WORKER_CONCURRENCY ?? '2', 10) || 2;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.onboardingBootstrap,
  async (job) => {
    log.info('onboarding-starter-job-start', { jobName: job.name, bullmqJobId: job.id });

    switch (job.name) {
      case JOB_NAMES.onboardingBootstrap.runStarter: {
        const payload = ZOnboardingStarterPayload.parse(job.data);

        return runStarterJob(payload.jobId);
      }
      default:
        throw new Error(`Unknown onboarding starter job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('onboarding-starter-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    error: errorMessage(err)
  });

  const data = job.data as { jobId?: string; organizationId?: string };

  await recordDeadLetterJob({
    organizationId: data?.organizationId ?? null,
    domain: 'onboarding-bootstrap',
    runId: data?.jobId ?? null,
    queueName: QUEUE_NAMES.onboardingBootstrap,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () =>
  log.info('onboarding-starter-worker-ready', { concurrency, queue: QUEUE_NAMES.onboardingBootstrap })
);
worker.on('error', (err) => log.error('onboarding-starter-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('onboarding-starter-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
