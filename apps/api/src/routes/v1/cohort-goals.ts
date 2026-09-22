import {
  ZPublicApiCohortGoalParam,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortGoal,
  ZPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';
import {
  archivePublicApiCohortGoalService,
  createPublicApiCohortGoalService,
  deletePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  listPublicApiCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohort-goal';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const GoalResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const GoalListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } }
  },
  required: ['success', 'data']
};

const jsonResponse = (description: string, schema: object) => ({
  description,
  content: { 'application/json': { schema } }
});

export const v1CohortGoalsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the goals in a cohort, with per-status learner counts',
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goals returned successfully', GoalListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const goals = await listPublicApiCohortGoalsService(orgId, params);

        return c.json({ success: true, data: goals }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort goals');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description:
        'Create a cohort goal. Required fields depend on type (complete_all, n_of_m, score, pass_rate, readiness) and deadlineKind (absolute, relative_to_join, recurring, none) — see the schema for per-combination requirements',
      tags: ['Public API Cohort Goals'],
      responses: {
        201: jsonResponse('Goal created successfully', GoalResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiCreateCohortGoal),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const goal = await createPublicApiCohortGoalService(orgId, actorId, params, payload);

        return c.json({ success: true, data: goal }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create cohort goal');
      }
    }
  )
  .get(
    '/:goalId',
    describeRoute({
      description: 'Get a cohort goal',
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal returned successfully', GoalResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const goal = await getPublicApiCohortGoalService(orgId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to get cohort goal');
      }
    }
  )
  .put(
    '/:goalId',
    describeRoute({
      description: 'Update a cohort goal',
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal updated successfully', GoalResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    validator('json', ZPublicApiUpdateCohortGoal),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const goal = await updatePublicApiCohortGoalService(orgId, params, payload);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort goal');
      }
    }
  )
  .delete(
    '/:goalId',
    describeRoute({
      description: 'Delete a cohort goal. This is a hard delete; use the archive action to keep history',
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal deleted successfully', GoalResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const goal = await deletePublicApiCohortGoalService(orgId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort goal');
      }
    }
  )
  .post(
    '/:goalId/archive',
    describeRoute({
      description: 'Archive a cohort goal (soft delete, keeps history)',
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal archived successfully', GoalResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const goal = await archivePublicApiCohortGoalService(orgId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to archive cohort goal');
      }
    }
  );
