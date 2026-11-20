import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  getOwnedAgentRun: vi.fn(),
  updateOwnedAgentRun: vi.fn(),
  createAgentRunEvent: vi.fn(),
  enqueueAgentRun: vi.fn(),
  removeQueuedBullmqJob: vi.fn(),
  assertCourseRunAccess: vi.fn(),
  assertConversationBelongsToCourse: vi.fn(),
  isRedisConfigured: vi.fn().mockReturnValue(true),
  getQueue: vi.fn()
}));

vi.mock('@cio/db/queries/agent', () => ({
  appendAgentRunInstruction: vi.fn(),
  createAgentRun: vi.fn(),
  createAgentRunEvent: mocks.createAgentRunEvent,
  getAgentRun: mocks.getOwnedAgentRun,
  getChatConversation: vi.fn(),
  listAgentRunEvents: vi.fn().mockResolvedValue([]),
  listAgentRuns: vi.fn().mockResolvedValue([]),
  listAgentRunSteps: vi.fn().mockResolvedValue([]),
  updateAgentRun: mocks.updateOwnedAgentRun
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn().mockResolvedValue(true)
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn().mockResolvedValue('11111111-1111-4111-8111-111111111111')
}));

vi.mock('@cio/jobs', () => ({
  QUEUE_NAMES: { agentCourseGeneration: 'agent-course-generation' },
  enqueueAgentCourseGenerationRun: vi.fn().mockResolvedValue('bullmq-job-123'),
  getQueue: mocks.getQueue,
  isRedisConfigured: mocks.isRedisConfigured,
  toJobId: vi.fn(
    (runId: string, attempt: number, executionKey: string) =>
      `agent-course-generation-${runId}-${attempt}-${executionKey}`
  )
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: Context, next: Next) => {
    c.set('user', { id: 'user-123' } as any);
    return next();
  }
}));

vi.mock('@api/middlewares/org-member', () => ({
  orgMemberMiddleware: async (_c: Context, next: Next) => next()
}));

import {
  getAgentRunState,
  pauseAgentRunState,
  retryAgentRunState,
  resumeAgentRunState
} from '@api/services/agent/run-state';
import { agentRunsRouter } from '@api/routes/agent/runs';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-123';
const RUN_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

function createMockRun(status: string) {
  const timestamp = new Date().toISOString();
  const isRunning = status === 'running';
  const isCanceled = status === 'canceled';

  return {
    id: RUN_ID,
    orgId: ORG_ID,
    userId: USER_ID,
    courseId: COURSE_ID,
    conversationId: null,
    status,
    phase: status === 'paused' ? 'paused' : 'implementing',
    progressPercent: 50,
    currentStepKey: null,
    approvedPlan: null,
    executionCursor: { bullmq: { jobId: 'job-1' } },
    sourceIds: [],
    modelSummary: '',
    queuedInstructions: [],
    lastError: null,
    attempt: 0,
    maxAttempts: 3,
    workerId: isRunning ? 'worker-1' : null,
    lockedAt: isRunning ? timestamp : null,
    cancelRequestedAt: isCanceled ? timestamp : null,
    startedAt: timestamp,
    finishedAt: isCanceled ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function createQueueMock({
  activeJobs = 1,
  jobState = 'waiting',
  hasJob = true,
  removed = 1
}: {
  activeJobs?: number;
  jobState?: string;
  hasJob?: boolean;
  removed?: number;
} = {}) {
  const getState = vi.fn().mockResolvedValue(jobState);
  const getJob = vi.fn().mockResolvedValue(hasJob ? { getState } : undefined);
  const getJobCounts = vi.fn().mockResolvedValue({ active: activeJobs });
  const remove = vi.fn().mockResolvedValue(removed);

  return { remove, getJob, getJobCounts };
}

describe('agent runs pause and resume state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQueue.mockReturnValue(createQueueMock());
  });

  describe('pauseAgentRunState', () => {
    it('pauses a running run without overwriting its owner', async () => {
      const runningRun = createMockRun('running');
      const pausedRun = { ...runningRun, status: 'paused', phase: 'paused' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(runningRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(pausedRun);

      const result = await pauseAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('paused');
      expect(mocks.updateOwnedAgentRun).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: RUN_ID,
          userId: USER_ID,
          status: 'paused',
          phase: 'paused',
          expectedStatuses: ['queued', 'running', 'waiting_for_input']
        })
      );
      // Must not overwrite the running worker's ownership
      expect(mocks.updateOwnedAgentRun.mock.calls[0][0]).not.toHaveProperty('workerId');
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: RUN_ID,
          eventType: 'run.paused'
        })
      );
    });

    it('returns as-is if already paused', async () => {
      const pausedRun = createMockRun('paused');
      mocks.getOwnedAgentRun.mockResolvedValueOnce(pausedRun);

      const result = await pauseAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('paused');
      expect(mocks.updateOwnedAgentRun).not.toHaveBeenCalled();
    });

    it('pauses a queued run and removes its queued BullMQ job', async () => {
      const queuedRun = createMockRun('queued');
      const pausedRun = { ...queuedRun, status: 'paused', phase: 'paused' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(queuedRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(pausedRun);

      const result = await pauseAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('paused');
      expect(mocks.getQueue).toHaveBeenCalled();
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID, eventType: 'run.queue_cancel_checked' })
      );
    });

    it('keeps a run that finished while pausing finished', async () => {
      const runningRun = createMockRun('running');
      const completedRun = { ...runningRun, status: 'completed', phase: 'completed' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(runningRun).mockResolvedValueOnce(completedRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(null);

      const result = await pauseAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('completed');
      expect(mocks.createAgentRunEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'run.paused' }));
    });

    it('rejects pausing a completed run', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('completed'));

      await expect(pauseAgentRunState(RUN_ID, USER_ID, ORG_ID)).rejects.toThrow(
        'Completed course generation cannot be paused'
      );
    });

    it('rejects pausing a canceled run', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('canceled'));

      await expect(pauseAgentRunState(RUN_ID, USER_ID, ORG_ID)).rejects.toThrow(
        'Canceled course generation cannot be paused'
      );
    });
  });

  describe('resumeAgentRunState', () => {
    it('resumes a paused run', async () => {
      const pausedRun = createMockRun('paused');
      const queuedRun = {
        ...pausedRun,
        status: 'queued',
        phase: 'implementing',
        cancelRequestedAt: null,
        finishedAt: null
      };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(pausedRun);
      mocks.updateOwnedAgentRun
        .mockResolvedValueOnce(queuedRun)
        .mockResolvedValueOnce({ ...queuedRun, executionCursor: { bullmq: { jobId: 'bullmq-job-123' } } });

      const result = await resumeAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('queued');
      expect(mocks.updateOwnedAgentRun).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: RUN_ID,
          userId: USER_ID,
          status: 'queued',
          phase: 'implementing',
          cancelRequestedAt: null,
          finishedAt: null,
          lastError: null,
          expectedStatuses: ['paused', 'waiting_for_input'],
          expectedWorkerId: null
        })
      );
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: RUN_ID,
          eventType: 'run.resumed'
        })
      );
    });

    it('does not requeue when a concurrent request already resumed the run', async () => {
      const pausedRun = createMockRun('paused');
      const runningRun = { ...pausedRun, status: 'running', workerId: 'worker-2' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(pausedRun).mockResolvedValueOnce(runningRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(null);

      const result = await resumeAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('running');
      expect(mocks.createAgentRunEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'run.resumed' }));
    });

    it('replaces the queued job when resuming a run that is already queued', async () => {
      const queuedRun = createMockRun('queued');

      mocks.getOwnedAgentRun.mockResolvedValueOnce(queuedRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce({
        ...queuedRun,
        executionCursor: { bullmq: { jobId: 'bullmq-job-123' } }
      });

      const result = await resumeAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('queued');
      expect(mocks.getQueue.mock.results[0].value.remove).toHaveBeenCalledWith('job-1');
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID, eventType: 'run.queue_cancel_checked' })
      );
    });

    it('marks the run failed when Redis is not configured', async () => {
      const pausedRun = createMockRun('paused');
      const queuedRun = { ...pausedRun, status: 'queued', phase: 'implementing' };
      const failedRun = {
        ...queuedRun,
        status: 'failed',
        phase: 'failed',
        lastError: { code: 'AGENT_RUN_QUEUE_UNAVAILABLE', message: 'Course generation is unavailable' }
      };

      mocks.isRedisConfigured.mockReturnValueOnce(false);
      mocks.getOwnedAgentRun.mockResolvedValueOnce(pausedRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(queuedRun).mockResolvedValueOnce(failedRun);

      const result = await resumeAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('failed');
      expect(mocks.updateOwnedAgentRun).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'failed',
          phase: 'failed',
          lastError: expect.objectContaining({ code: 'AGENT_RUN_QUEUE_UNAVAILABLE' })
        })
      );
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({ runId: RUN_ID, eventType: 'run.enqueue_skipped' })
      );
    });

    it('rejects resuming a canceled run because cancel is terminal', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('canceled'));

      await expect(resumeAgentRunState(RUN_ID, USER_ID, ORG_ID)).rejects.toMatchObject({
        code: 'AGENT_RUN_CANCELED',
        statusCode: 409
      });
      expect(mocks.updateOwnedAgentRun).not.toHaveBeenCalled();
    });

    it('resumes a run that is waiting for input', async () => {
      const waitingRun = createMockRun('waiting_for_input');
      const queuedRun = { ...waitingRun, status: 'queued', phase: 'implementing' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(waitingRun);
      mocks.updateOwnedAgentRun
        .mockResolvedValueOnce(queuedRun)
        .mockResolvedValueOnce({ ...queuedRun, executionCursor: { bullmq: { jobId: 'bullmq-job-123' } } });

      const result = await resumeAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.status).toBe('queued');
    });

    it('rejects resuming a completed run', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('completed'));

      await expect(resumeAgentRunState(RUN_ID, USER_ID, ORG_ID)).rejects.toThrow(
        'Completed course generation cannot be resumed'
      );
    });

    it('rejects resuming a failed run', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('failed'));

      await expect(resumeAgentRunState(RUN_ID, USER_ID, ORG_ID)).rejects.toThrow(
        'Failed course generation must be retried'
      );
    });
  });

  describe('retryAgentRunState', () => {
    it('increments the attempt once for concurrent retries', async () => {
      const failedRun = createMockRun('failed');
      const queuedRun = { ...failedRun, status: 'queued', attempt: 1 };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(failedRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(queuedRun).mockResolvedValueOnce(queuedRun);

      const result = await retryAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.attempt).toBe(1);
      expect(mocks.updateOwnedAgentRun).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          status: 'queued',
          attempt: 1,
          expectedStatuses: ['failed'],
          expectedWorkerId: null
        })
      );
    });

    it('does not retry when a concurrent retry already updated the run', async () => {
      const failedRun = createMockRun('failed');
      const currentRun = { ...failedRun, status: 'failed', attempt: 1 };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(failedRun);
      mocks.getOwnedAgentRun.mockResolvedValueOnce(currentRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(null);

      const result = await retryAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.run.attempt).toBe(1);
      expect(mocks.createAgentRunEvent).not.toHaveBeenCalledWith(expect.objectContaining({ eventType: 'run.retried' }));
    });
  });

  describe('queue health', () => {
    it('reports the queued job state with the queue active count', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce(createQueueMock({ jobState: 'waiting', activeJobs: 1 }));

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'waiting', activeJobs: 1 });
    });

    it('reports a missing job when the queue no longer holds it', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce(createQueueMock({ hasJob: false, activeJobs: 0 }));

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'missing', activeJobs: 0 });
    });

    it('reports a delayed job without calling it a stall', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce(createQueueMock({ jobState: 'delayed', activeJobs: 0 }));

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'delayed', activeJobs: 0 });
    });

    it('reports unavailable when the queue does not answer before the deadline', async () => {
      vi.useFakeTimers();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      try {
        const queueMock = createQueueMock();
        queueMock.getJobCounts.mockReturnValue(new Promise(() => undefined));

        mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
        mocks.getQueue.mockReturnValueOnce(queueMock);

        const pending = getAgentRunState(RUN_ID, USER_ID, ORG_ID);
        await vi.advanceTimersByTimeAsync(2_000);

        const result = await pending;

        expect(result.queueHealth).toEqual({ state: 'unavailable', activeJobs: 0 });
      } finally {
        consoleError.mockRestore();
        vi.useRealTimers();
      }
    });

    it('skips the queue entirely for a run that is not queued', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('running'));

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toBeNull();
      expect(mocks.getQueue).not.toHaveBeenCalled();
    });
  });

  describe('HTTP endpoints', () => {
    it('POST /agent/runs/:runId/pause pauses the run', async () => {
      const runningRun = createMockRun('running');
      const pausedRun = { ...runningRun, status: 'paused', phase: 'paused' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(runningRun);
      mocks.updateOwnedAgentRun.mockResolvedValueOnce(pausedRun);

      const res = await agentRunsRouter.request(`/${RUN_ID}/pause`, {
        method: 'POST',
        headers: { 'cio-org-id': ORG_ID }
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.run.status).toBe('paused');
    });

    it('POST /agent/runs/:runId/resume returns 409 for a canceled run', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('canceled'));

      const res = await agentRunsRouter.request(`/${RUN_ID}/resume`, {
        method: 'POST',
        headers: { 'cio-org-id': ORG_ID }
      });

      expect(res.status).toBe(409);
      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.code).toBe('AGENT_RUN_CANCELED');
    });

    it('POST /agent/runs/:runId/resume resumes the run', async () => {
      const pausedRun = createMockRun('paused');
      const queuedRun = { ...pausedRun, status: 'queued', phase: 'implementing' };

      mocks.getOwnedAgentRun.mockResolvedValueOnce(pausedRun);
      mocks.updateOwnedAgentRun
        .mockResolvedValueOnce(queuedRun)
        .mockResolvedValueOnce({ ...queuedRun, executionCursor: { bullmq: { jobId: 'bullmq-job-123' } } });

      const res = await agentRunsRouter.request(`/${RUN_ID}/resume`, {
        method: 'POST',
        headers: { 'cio-org-id': ORG_ID }
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.run.status).toBe('queued');
    });
  });
});
