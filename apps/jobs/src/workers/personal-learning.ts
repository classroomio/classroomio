import './../bootstrap';

import { Worker } from 'bullmq';

import { generatePersonalLearningSession } from '@cio/core/services/personal-learning/generate-session';
import { JOB_NAMES, QUEUE_NAMES, ZPersonalLearningSessionPayload, createRedisConnection } from '@cio/jobs';

import { errorMessage } from '../utils/cancel';
import { log } from '../utils/logger';

const connection = createRedisConnection();
const concurrency = 2;
const worker = new Worker(
  QUEUE_NAMES.personalLearning,
  async (job) => {
    if (job.name !== JOB_NAMES.personalLearning.generateSession)
      throw new Error(`Unknown personal learning job: ${job.name}`);

    const payload = ZPersonalLearningSessionPayload.parse(job.data);
    log.info('personal-learning-session-start', {
      sessionId: payload.sessionId,
      journeyId: payload.journeyId,
      status: 'generating',
      attempt: job.attemptsMade + 1
    });

    return generatePersonalLearningSession({ sessionId: payload.sessionId, attempt: job.attemptsMade + 1 });
  },
  { connection, concurrency }
);

worker.on('failed', (job) => {
  if (!job) return;
  const payload = job.data as { sessionId?: string; journeyId?: string };
  log.error('personal-learning-session-job-failed', {
    sessionId: payload?.sessionId,
    journeyId: payload?.journeyId,
    status: 'retrying-or-failed',
    attempt: job.attemptsMade
  });
});
worker.on('ready', () => log.info('personal-learning-worker-ready', { concurrency }));
worker.on('error', (error) => log.error('personal-learning-worker-error', { error: errorMessage(error) }));

const shutdown = async (signal: string) => {
  log.info('personal-learning-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
