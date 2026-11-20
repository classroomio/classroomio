import type { AgentRun, AgentRunQueueHealth } from '$features/ai-assistant/utils/types';

const STALLED_QUEUE_STATES = new Set(['failed', 'missing', 'unavailable']);

/**
 * When the run's current queue job was handed to the queue, falling back to the
 * row's creation time. Only decides when the queue is worth inspecting; it is
 * never evidence on its own that the worker is down.
 */
export function getRunQueuedSince(
  run: Pick<AgentRun, 'createdAt' | 'executionCursor'> | null | undefined
): string | null {
  if (!run) return null;

  const enqueuedAt = getRunEnqueuedAt(run);

  return enqueuedAt ?? run.createdAt;
}

function getRunEnqueuedAt(run: Pick<AgentRun, 'executionCursor'>): string | null {
  const bullmq = run.executionCursor?.bullmq;

  if (!bullmq || typeof bullmq !== 'object') {
    return null;
  }

  const enqueuedAt = (bullmq as Record<string, unknown>).enqueuedAt;

  return typeof enqueuedAt === 'string' && enqueuedAt.length > 0 ? enqueuedAt : null;
}

/**
 * Whether BullMQ shows the run is stuck: its job is gone or failed, Redis is
 * unreachable, or the job is waiting while the queue processes nothing.
 */
export function isRunQueueStalled(
  health: Pick<AgentRunQueueHealth, 'state' | 'activeJobs'> | null | undefined
): boolean {
  if (!health) return false;

  if (STALLED_QUEUE_STATES.has(health.state)) return true;

  return health.state === 'waiting' && health.activeJobs === 0;
}
