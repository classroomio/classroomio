import './../bootstrap';

import { UnrecoverableError, Worker } from 'bullmq';

import { getPackageVersionById, recordDeadLetterJob, updateMediaJob, updatePackageVersion } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';

import { JobCanceledError, errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { processScormPackage } from '../processors/activity-package/process-scorm';
import { cleanupPackageVersionStorage } from '../processors/activity-package/cleanup-storage';

const concurrency = Number.parseInt(env.ACTIVITY_PACKAGE_WORKER_CONCURRENCY ?? '1', 10) || 1;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.activityPackage,
  async (job) => {
    log.info('activity-package-job-start', { jobName: job.name, bullmqJobId: job.id, attempt: job.attemptsMade + 1 });

    switch (job.name) {
      case JOB_NAMES.activityPackage.processPackage:
        return processScormPackage(job.data);
      default:
        throw new Error(`Unknown activity-package job: ${job.name}`);
    }
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  try {
    const data = job.data as {
      mediaJobId?: string;
      assetId?: string;
      packageVersionId?: string;
      actorContext?: { organizationId?: string };
    };

    if (err instanceof JobCanceledError) {
      log.warn('activity-package-job-canceled', { jobName: job.name, bullmqJobId: job.id });
      const canceledError = { code: 'CANCELED', message: 'Run canceled by user' };
      await updateMediaJob(err.mediaJobId, {
        status: 'canceled',
        stage: 'canceled',
        error: canceledError
      });

      if (data?.packageVersionId) {
        const processedAt = new Date().toISOString();
        await updatePackageVersion(data.packageVersionId, {
          status: 'failed',
          error: canceledError,
          processedAt
        });
        const version = await getPackageVersionById(data.packageVersionId);
        if (version?.contentPrefix) {
          await cleanupPackageVersionStorage(version);
        }
      }

      return;
    }

    log.error('activity-package-job-failed', {
      jobName: job.name,
      bullmqJobId: job.id,
      attempt: job.attemptsMade,
      error: errorMessage(err)
    });

    const isUnrecoverable = err instanceof UnrecoverableError;
    const isFinalAttempt = isUnrecoverable || job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isFinalAttempt) return;

    const recordedVersion = data?.packageVersionId ? await getPackageVersionById(data.packageVersionId) : null;
    const recordedError = recordedVersion?.status === 'failed' ? recordedVersion.error : null;
    const finalError = recordedError ?? { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err) };
    if (data?.mediaJobId) {
      await updateMediaJob(data.mediaJobId, {
        status: 'failed',
        stage: 'failed',
        error: finalError
      });
    }

    if (data?.packageVersionId && data?.mediaJobId && !recordedError) {
      const processedAt = new Date().toISOString();
      await updatePackageVersion(data.packageVersionId, {
        status: 'failed',
        error: finalError,
        processedAt
      });
    }

    await recordDeadLetterJob({
      organizationId: data?.actorContext?.organizationId ?? null,
      domain: 'activity-package',
      runId: data?.mediaJobId ?? null,
      queueName: QUEUE_NAMES.activityPackage,
      jobName: job.name,
      bullmqJobId: job.id ?? null,
      payload: job.data as Record<string, unknown>,
      error: { ...finalError, stack: err.stack },
      attempts: job.attemptsMade
    });
  } catch (handlerError) {
    log.error('activity-package-worker-failure-handler-error', {
      jobName: job.name,
      bullmqJobId: job.id,
      error: errorMessage(handlerError)
    });
  }
});

worker.on('ready', () =>
  log.info('activity-package-worker-ready', { concurrency, queue: QUEUE_NAMES.activityPackage })
);
worker.on('error', (err) => log.error('activity-package-worker-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('activity-package-worker-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
