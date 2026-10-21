import {
  ZPublicApiCohortGoalListItemResponse,
  ZPublicApiCohortGoalOverviewItemResponse,
  ZPublicApiCohortGoalParam,
  ZPublicApiCohortGoalResponse,
  ZPublicApiCohortParam,
  ZPublicApiEvaluateCohortGoalsResponse,
  ZPublicApiCreateCohortGoal,
  ZPublicApiMyCohortGoalResponse,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';
import {
  archivePublicApiCohortGoalService,
  createPublicApiCohortGoalService,
  deletePublicApiCohortGoalService,
  evaluateAllPublicApiCohortGoalsService,
  evaluatePublicApiCohortGoalService,
  getPublicApiCohortGoalService,
  getPublicApiOrgGoalsOverviewService,
  listPublicApiCohortGoalsService,
  listPublicApiMyCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohorts/goals';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, cohortForbiddenResponses } from './docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const GoalResponse = itemResponse(ZPublicApiCohortGoalResponse);
const EvaluateResponse = itemResponse(ZPublicApiEvaluateCohortGoalsResponse);

export const v1CohortGoalsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the active goals in a cohort, with learner counts per status; ${COHORT_MEMBER_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goals returned successfully', paginatedResponse(ZPublicApiCohortGoalListItemResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCohortGoalsService(orgId, actorId, params, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort goals');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a cohort goal; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        201: jsonResponse('Goal created successfully', GoalResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
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
  .post(
    '/evaluate-all',
    describeRoute({
      description: `Re-evaluate every active goal in a cohort now, without waiting for the scheduled run; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goals evaluated', EvaluateResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await evaluateAllPublicApiCohortGoalsService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to evaluate cohort goals');
      }
    }
  )
  .get(
    '/:goalId',
    describeRoute({
      description: `Get a cohort goal; ${COHORT_MEMBER_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goal returned successfully', GoalResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const goal = await getPublicApiCohortGoalService(orgId, actorId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to get cohort goal');
      }
    }
  )
  .put(
    '/:goalId',
    describeRoute({
      description: `Update the fields you send on a cohort goal; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goal updated successfully', GoalResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    validator('json', ZPublicApiUpdateCohortGoal),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const goal = await updatePublicApiCohortGoalService(orgId, actorId, params, payload);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort goal');
      }
    }
  )
  .delete(
    '/:goalId',
    describeRoute({
      description: `Permanently delete a cohort goal and its learner progress; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse(
          'Goal and its learner progress deleted; archive the goal instead to keep its history',
          GoalResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const goal = await deletePublicApiCohortGoalService(orgId, actorId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort goal');
      }
    }
  )
  .post(
    '/:goalId/archive',
    describeRoute({
      description: `Archive a cohort goal so it stops being evaluated and leaves the goal list while its history is kept; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goal archived successfully', GoalResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or goal not found' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const goal = await archivePublicApiCohortGoalService(orgId, actorId, params);

        return c.json({ success: true, data: goal }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to archive cohort goal');
      }
    }
  )
  .post(
    '/:goalId/evaluate',
    describeRoute({
      description: `Re-evaluate one goal's learner statuses now, without waiting for the scheduled run; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse('Goal evaluated', EvaluateResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or goal not found' },
        409: { description: 'The goal is archived; archived goals are not evaluated, so their history is kept' }
      }
    }),
    validator('param', ZPublicApiCohortGoalParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await evaluatePublicApiCohortGoalService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to evaluate cohort goal');
      }
    }
  );

export const v1OrgCohortGoalsRouter = new Hono()
  .get(
    '/my/goals',
    describeRoute({
      description: "List the key creator's own goal assignments across their cohorts, with status and progress.",
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse(
          "The key creator's assignments for active goals, limited to cohorts in the key's organization",
          paginatedResponse(ZPublicApiMyCohortGoalResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.scope
      }
    }),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listPublicApiMyCohortGoalsService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list goal assignments');
      }
    }
  )
  .get(
    '/goals/overview',
    describeRoute({
      description:
        'List one entry per active goal across every cohort, with learner counts per status; the key creator must be an org admin or tutor.',
      tags: ['Cohort Goals'],
      responses: {
        200: jsonResponse(
          'Goals overview returned successfully',
          paginatedResponse(ZPublicApiCohortGoalOverviewItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks the public_api:* or cohort:read/write scope, or the actor is not an org admin or tutor'
        }
      }
    }),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await getPublicApiOrgGoalsOverviewService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load goals overview');
      }
    }
  );
