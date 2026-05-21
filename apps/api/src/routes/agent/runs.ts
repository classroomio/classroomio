import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';
import {
  ZAgentRunCourseQuery,
  ZAgentRunCreateBody,
  ZAgentRunInstructionBody,
  ZAgentRunParam
} from '@cio/utils/validation/agent';
import { handleError } from '@api/utils/errors';
import {
  appendAgentRunInstructionState,
  cancelAgentRunState,
  createAgentRunState,
  getAgentRunState,
  listAgentRunStates,
  resumeAgentRunState,
  retryAgentRunState
} from '@api/services/agent/run-state';

export const agentRunsRouter = new Hono()
  /**
   * GET /agent/runs?courseId=...
   * List durable course-generation runs for the current user and course.
   */
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZAgentRunCourseQuery), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { courseId } = c.req.valid('query');
      const runs = await listAgentRunStates(courseId, user.id, orgId);

      return c.json({ success: true as const, data: runs });
    } catch (error) {
      return handleError(c, error, 'Failed to list agent runs');
    }
  })

  /**
   * POST /agent/runs
   * Create a durable run record before worker-backed generation begins.
   */
  .post('/', authMiddleware, orgMemberMiddleware, zValidator('json', ZAgentRunCreateBody), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');
      const run = await createAgentRunState({
        orgId,
        userId: user.id,
        courseId: data.courseId,
        conversationId: data.conversationId,
        phase: data.phase,
        approvedPlan: data.approvedPlan,
        executionCursor: data.executionCursor,
        sourceIds: data.sourceIds,
        modelSummary: data.modelSummary
      });

      return c.json({ success: true as const, data: run }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create agent run');
    }
  })

  /**
   * GET /agent/runs/:runId
   * Fetch the run, checkpoint steps, and progress events.
   */
  .get('/:runId', authMiddleware, orgMemberMiddleware, zValidator('param', ZAgentRunParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { runId } = c.req.valid('param');
      const run = await getAgentRunState(runId, user.id, orgId);

      return c.json({ success: true as const, data: run });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch agent run');
    }
  })

  /**
   * POST /agent/runs/:runId/resume
   * Requeue a paused or waiting run from its saved cursor.
   */
  .post('/:runId/resume', authMiddleware, orgMemberMiddleware, zValidator('param', ZAgentRunParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { runId } = c.req.valid('param');
      const run = await resumeAgentRunState(runId, user.id, orgId);

      return c.json({ success: true as const, data: run });
    } catch (error) {
      return handleError(c, error, 'Failed to resume agent run');
    }
  })

  /**
   * POST /agent/runs/:runId/retry
   * Requeue a failed run without duplicating completed checkpointed steps.
   */
  .post('/:runId/retry', authMiddleware, orgMemberMiddleware, zValidator('param', ZAgentRunParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { runId } = c.req.valid('param');
      const run = await retryAgentRunState(runId, user.id, orgId);

      return c.json({ success: true as const, data: run });
    } catch (error) {
      return handleError(c, error, 'Failed to retry agent run');
    }
  })

  /**
   * POST /agent/runs/:runId/cancel
   * Mark the run canceled so workers stop before the next step.
   */
  .post('/:runId/cancel', authMiddleware, orgMemberMiddleware, zValidator('param', ZAgentRunParam), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { runId } = c.req.valid('param');
      const run = await cancelAgentRunState(runId, user.id, orgId);

      return c.json({ success: true as const, data: run });
    } catch (error) {
      return handleError(c, error, 'Failed to cancel agent run');
    }
  })

  /**
   * POST /agent/runs/:runId/instructions
   * Queue teacher instructions for the worker to consume between steps.
   */
  .post(
    '/:runId/instructions',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZAgentRunParam),
    zValidator('json', ZAgentRunInstructionBody),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.req.header('cio-org-id')!;
        const { runId } = c.req.valid('param');
        const { text } = c.req.valid('json');
        const run = await appendAgentRunInstructionState(runId, user.id, orgId, text);

        return c.json({ success: true as const, data: run });
      } catch (error) {
        return handleError(c, error, 'Failed to queue agent run instruction');
      }
    }
  );
