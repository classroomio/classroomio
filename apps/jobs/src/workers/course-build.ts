import './../bootstrap';

import { UnrecoverableError, Worker, type Job } from 'bullmq';

import { BudgetExceededError, createFetcher } from '@cio/course-builder';
import { recordDeadLetterJob } from '@cio/db/queries';
import {
  COURSE_BUILD_QUEUES,
  COURSE_BUILD_QUEUE_STAGES,
  ZCourseBuildStagePayload,
  createRedisConnection,
  type TCourseBuildQueueStage,
  type TCourseBuildStagePayload
} from '@cio/jobs';
import {
  failCourseBuild,
  failCourseBuildCourse,
  failCourseBuildRead,
  runCourseBuildDiscover,
  runCourseBuildExport,
  runCourseBuildFinish,
  runCourseBuildPlan,
  runCourseBuildRead,
  runCourseBuildUnderstand,
  runCourseBuildWrite,
  type CourseBuildHost
} from '@cio/core/services/course-builder/build';

import { env } from '../config/env';
import { closeRenderer, rendererFromEnv } from '../services/course-builder/renderer-from-env';
import { errorMessage } from '../utils/cancel';
import { log } from '../utils/logger';

const DEFAULT_CONCURRENCY: Record<TCourseBuildQueueStage, number> = {
  discover: 2,
  read: 3,
  understand: 1,
  plan: 1,
  write: 2,
  finish: 2,
  export: 2
};

function concurrencyOf(stage: TCourseBuildQueueStage): number {
  const configured = (env.COURSE_BUILD_CONCURRENCY ?? '').split(',').map((value) => Number.parseInt(value, 10));
  const value = configured[COURSE_BUILD_QUEUE_STAGES.indexOf(stage)];

  return Number.isInteger(value) && value > 0 ? value : DEFAULT_CONCURRENCY[stage];
}

/** One fetcher for the whole process, so reads running at once still pace each host together. */
const fetcher = createFetcher();

function host(): CourseBuildHost {
  if (!env.ANTHROPIC_API_KEY) throw new UnrecoverableError('ANTHROPIC_API_KEY is not set for course builds');

  return { anthropicApiKey: env.ANTHROPIC_API_KEY, fetcher, renderer: rendererFromEnv() };
}

function requireItem(value: string | undefined, name: string): string {
  if (!value) throw new UnrecoverableError(`${name} is missing from the job payload`);

  return value;
}

async function runStage(stage: TCourseBuildQueueStage, payload: TCourseBuildStagePayload): Promise<void> {
  const { jobId } = payload;
  switch (stage) {
    case 'discover':
      return runCourseBuildDiscover(jobId, host());
    case 'read':
      return runCourseBuildRead(jobId, requireItem(payload.sourceId, 'sourceId'), host());
    case 'understand':
      return runCourseBuildUnderstand(jobId, host());
    case 'plan':
      return runCourseBuildPlan(jobId, host());
    case 'write':
      return runCourseBuildWrite(jobId, requireItem(payload.courseBuildCourseId, 'courseBuildCourseId'), host());
    case 'finish':
      return runCourseBuildFinish(jobId, requireItem(payload.courseBuildCourseId, 'courseBuildCourseId'), host());
    case 'export':
      return runCourseBuildExport(jobId, requireItem(payload.courseBuildCourseId, 'courseBuildCourseId'), host());
  }
}

/** Records a stage that will not run again: a source, a course or the whole build, by what the stage worked on. */
async function settleFailure(stage: TCourseBuildQueueStage, payload: TCourseBuildStagePayload, error: Error) {
  if (stage === 'read' && payload.sourceId) return failCourseBuildRead(payload.jobId, payload.sourceId, error);
  if (payload.courseBuildCourseId) return failCourseBuildCourse(payload.jobId, payload.courseBuildCourseId, error);

  return failCourseBuild(payload.jobId, error);
}

function isFinalAttempt(job: Job, error: Error): boolean {
  return error instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);
}

const connection = createRedisConnection();

const workers = COURSE_BUILD_QUEUE_STAGES.map((stage) => {
  const queue = COURSE_BUILD_QUEUES[stage];
  const concurrency = concurrencyOf(stage);
  const worker = new Worker(
    queue,
    async (job) => {
      const payload = ZCourseBuildStagePayload.parse(job.data);
      log.info('course-build-stage-start', { stage, bullmqJobId: job.id, jobId: payload.jobId });
      try {
        await runStage(stage, payload);
      } catch (error) {
        if (error instanceof BudgetExceededError) throw new UnrecoverableError(error.message);

        throw error;
      }
      log.info('course-build-stage-done', { stage, bullmqJobId: job.id, jobId: payload.jobId });
    },
    { connection, concurrency }
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;

    log.error('course-build-stage-failed', { stage, bullmqJobId: job.id, error: errorMessage(err) });
    if (!isFinalAttempt(job, err)) return;

    const payload = ZCourseBuildStagePayload.safeParse(job.data);
    if (payload.success) await settleFailure(stage, payload.data, err).catch(() => undefined);
    await recordDeadLetterJob({
      organizationId: payload.success ? payload.data.organizationId : null,
      domain: 'course-build',
      runId: payload.success ? payload.data.jobId : null,
      queueName: queue,
      jobName: job.name,
      bullmqJobId: job.id ?? null,
      payload: job.data as Record<string, unknown>,
      error: { code: 'WORKER_EXHAUSTED_RETRIES', message: errorMessage(err), stack: err.stack },
      attempts: job.attemptsMade
    });
  });
  worker.on('ready', () => log.info('course-build-worker-ready', { stage, concurrency, queue }));
  worker.on('error', (err) => log.error('course-build-worker-error', { stage, error: errorMessage(err) }));

  return worker;
});

const shutdown = async (signal: string) => {
  log.info('course-build-worker-shutdown', { signal });
  await Promise.all(workers.map((worker) => worker.close()));
  await closeRenderer();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
