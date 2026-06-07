import './../bootstrap';

import { Worker } from 'bullmq';

import { recordDeadLetterJob } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, ZAgentCourseGenerationPayload, createRedisConnection } from '@cio/jobs';
import { runAgentCourseGenerationJob } from '@cio/core';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';

const concurrency = Number.parseInt(env.AGENT_COURSE_GENERATION_WORKER_CONCURRENCY ?? '1', 10) || 1;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.agentCourseGeneration,
  async (job) => {
    log.info('agent-course-generation-job-start', {
      jobName: job.name,
      bullmqJobId: job.id,
      attempt: job.attemptsMade + 1
    });

    switch (job.name) {
      case JOB_NAMES.agentCourseGeneration.run: {
        const payload = ZAgentCourseGenerationPayload.parse(job.data);

        return runAgentCourseGenerationJob({
          runId: payload.runId,
          bullmqJobId: job.id ?? null
        });
      }
      default:
        throw new Error(`Unknown agent course-generation job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('agent-course-generation-job-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  const data = job.data as { runId?: string; organizationId?: string };

  await recordDeadLetterJob({
    organizationId: data?.organizationId ?? null,
    domain: 'agent-course-generation',
    runId: data?.runId ?? null,
    queueName: QUEUE_NAMES.agentCourseGeneration,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () =>
  log.info('agent-course-generation-worker-ready', { concurrency, queue: QUEUE_NAMES.agentCourseGeneration })
);
worker.on('error', (err) => log.error('agent-course-generation-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('agent-course-generation-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
