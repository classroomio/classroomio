import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getQueue, queue, failedJob } = vi.hoisted(() => {
  const failedJob = {
    getState: vi.fn(async () => 'failed'),
    remove: vi.fn(async () => undefined)
  };
  const queue = {
    getJob: vi.fn(async () => failedJob),
    add: vi.fn(async (_name: string, _payload: unknown, options: { jobId: string }) => ({ id: options.jobId }))
  };

  return { getQueue: vi.fn(() => queue), queue, failedJob };
});

vi.mock('../../../../packages/jobs/src/queues/factories', () => ({ getQueue }));

import { enqueuePersonalLearningSession } from '../../../../packages/jobs/src/enqueue/personal-learning';

describe('enqueuePersonalLearningSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    failedJob.getState.mockResolvedValue('failed');
    queue.getJob.mockResolvedValue(failedJob);
  });

  it('removes a retained failed job before reusing its deterministic ID', async () => {
    await enqueuePersonalLearningSession({
      sessionId: 'session-1',
      journeyId: 'journey-1'
    });

    expect(queue.getJob).toHaveBeenCalledWith('personal-session-journey-1-1');
    expect(failedJob.remove).toHaveBeenCalledOnce();
    expect(queue.add.mock.invocationCallOrder[0]).toBeGreaterThan(failedJob.remove.mock.invocationCallOrder[0]);
  });

  it('removes a retained completed job before reusing its deterministic ID', async () => {
    failedJob.getState.mockResolvedValue('completed');

    await enqueuePersonalLearningSession({ sessionId: 'session-1', journeyId: 'journey-1' });

    expect(failedJob.remove).toHaveBeenCalledOnce();
  });

  it('does not remove a job that may still be running', async () => {
    failedJob.getState.mockResolvedValue('active');

    await enqueuePersonalLearningSession({ sessionId: 'session-1', journeyId: 'journey-1' });

    expect(failedJob.remove).not.toHaveBeenCalled();
  });
});
