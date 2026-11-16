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
  isRedisConfigured: mocks.isRedisConfigured
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

import { getAgentRunState, pauseAgentRunState, resumeAgentRunState } from '@api/services/agent/run-state';
import { agentRunsRouter } from '@api/routes/agent/runs';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = 'user-123';
const RUN_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

function createMockRun(status: string) {
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
    workerId: status === 'running' ? 'worker-1' : null,
    lockedAt: status === 'running' ? new Date().toISOString() : null,
    cancelRequestedAt: status === 'canceled' ? new Date().toISOString() : null,
    startedAt: new Date().toISOString(),
    finishedAt: status === 'canceled' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe('agent runs pause and resume state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQueue.mockReturnValue({
      remove: vi.fn().mockResolvedValue(1),
      getJob: vi.fn().mockResolvedValue({ getState: vi.fn().mockResolvedValue('waiting') }),
      getJobCounts: vi.fn().mockResolvedValue({ active: 1 })
    });
  });

  describe('pauseAgentRunState', () => {
    it('pauses a running run', async () => {
      const runningRun = createMockRun('running');
      const pausedRun = { ...runningRun, status: 'paused', phase: 'paused', workerId: null, lockedAt: null };

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
          workerId: null,
          lockedAt: null
        })
      );
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
          workerId: null,
          lockedAt: null,
          lastError: null
        })
      );
      expect(mocks.createAgentRunEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: RUN_ID,
          eventType: 'run.resumed'
        })
      );
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

  describe('queue health', () => {
    it('reports the queued job state with the queue active count', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce({
        getJob: vi.fn().mockResolvedValue({ getState: vi.fn().mockResolvedValue('waiting') }),
        getJobCounts: vi.fn().mockResolvedValue({ active: 1 })
      });

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'waiting', activeJobs: 1 });
    });

    it('reports a missing job when the queue no longer holds it', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce({
        getJob: vi.fn().mockResolvedValue(undefined),
        getJobCounts: vi.fn().mockResolvedValue({ active: 0 })
      });

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'missing', activeJobs: 0 });
    });

    it('reports a delayed job without calling it a stall', async () => {
      mocks.getOwnedAgentRun.mockResolvedValueOnce(createMockRun('queued'));
      mocks.getQueue.mockReturnValueOnce({
        getJob: vi.fn().mockResolvedValue({ getState: vi.fn().mockResolvedValue('delayed') }),
        getJobCounts: vi.fn().mockResolvedValue({ active: 0 })
      });

      const result = await getAgentRunState(RUN_ID, USER_ID, ORG_ID);

      expect(result.queueHealth).toEqual({ state: 'delayed', activeJobs: 0 });
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
