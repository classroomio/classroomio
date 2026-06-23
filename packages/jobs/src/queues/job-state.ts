import { getQueue } from './factories';
import type { QueueName } from './names';
import { JOB_STATUS, type JobEnvelope, type JobStatus, suggestNextPollMs } from '../status';

function mapBullState(state: string): JobStatus {
  switch (state) {
    case 'completed':
      return JOB_STATUS.completed;
    case 'failed':
      return JOB_STATUS.failed;
    case 'active':
      return JOB_STATUS.running;
    default:
      // waiting | waiting-children | delayed | prioritized | paused
      return JOB_STATUS.queued;
  }
}

/**
 * Read a queued job's status as a `JobEnvelope` directly from BullMQ — no DB
 * ledger. Used by domains (e.g. notify-course-exercise) that don't need a
 * durable run history, just "is it done yet?" polling. Returns null if the
 * job no longer exists (e.g. retention swept it).
 */
export async function getQueueJobEnvelope(
  queueName: QueueName,
  jobId: string,
  domain: string,
  pollCount = 0
): Promise<JobEnvelope | null> {
  const job = await getQueue(queueName).getJob(jobId);
  if (!job) {
    return null;
  }

  const status = mapBullState(await job.getState());
  const finishedOn = job.finishedOn ?? job.processedOn ?? job.timestamp;

  return {
    job: {
      id: String(job.id),
      domain,
      status,
      stage: null,
      progressPercent: typeof job.progress === 'number' ? job.progress : null,
      createdAt: new Date(job.timestamp).toISOString(),
      updatedAt: new Date(finishedOn).toISOString(),
      result: (job.returnvalue as Record<string, unknown> | null) ?? null,
      error: job.failedReason ? { code: 'JOB_FAILED', message: job.failedReason } : null,
      attempt: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 1
    },
    events: [],
    nextPollMs: suggestNextPollMs(status, pollCount)
  };
}
