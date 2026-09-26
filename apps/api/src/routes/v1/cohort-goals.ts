import {
  ZPublicApiCohortGoalListItemResponse,
  ZPublicApiCohortGoalParam,
  ZPublicApiCohortGoalResponse,
  ZPublicApiCohortParam,
  ZPublicApiEvaluateCohortGoalsResponse,
  ZPublicApiCreateCohortGoal,
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
  listPublicApiCohortGoalsService,
  updatePublicApiCohortGoalService
} from '@api/services/v1/cohort-goal';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, PAGINATION_NOTE, cohortForbiddenResponses } from './cohort-route-docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const GoalResponse = itemResponse(ZPublicApiCohortGoalResponse);
const EvaluateResponse = itemResponse(ZPublicApiEvaluateCohortGoalsResponse);

export const v1CohortGoalsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the active goals in a cohort, with per-status learner counts. ${PAGINATION_NOTE} ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Create a cohort goal. Required fields depend on type (complete_all, n_of_m, score, pass_rate, readiness) and deadlineKind (absolute, relative_to_join, recurring, none); see the schema for per-combination requirements. Every courseId must already be linked to the cohort. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Re-evaluate every active goal in the cohort now, instead of waiting for the scheduled run. data.evaluated is the number of learner assignments evaluated. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Get a cohort goal. ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Update a cohort goal. Send only the fields to change; omitted fields keep their current values, and the resulting goal must still satisfy the create rules. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Permanently delete a cohort goal and its learner progress. Use the archive action to keep history. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal deleted successfully', GoalResponse),
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
      description: `Archive a cohort goal. It stops being evaluated and drops out of the goal list, but its history is kept. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
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
      description: `Re-evaluate one goal's learner statuses now, instead of waiting for the scheduled run. data.evaluated is the number of learner assignments evaluated. Archived goals are not evaluated, so their history is kept; evaluating one returns 409. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohort Goals'],
      responses: {
        200: jsonResponse('Goal evaluated', EvaluateResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort or goal not found' },
        409: { description: 'The goal is archived' }
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
