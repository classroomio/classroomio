import {
  ZPublicApiCohortParam,
  ZPublicApiCreateCohort,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohort
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCohortService,
  deletePublicApiCohortService,
  getPublicApiCohortService,
  listCohortsService,
  updatePublicApiCohortService
} from '@api/services/v1/cohort';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { v1CohortCoursesRouter } from './cohort-courses';
import { v1CohortGoalsRouter } from './cohort-goals';
import { v1CohortMembersRouter } from './cohort-members';
import { v1CohortNewsfeedRouter } from './cohort-newsfeed';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, PAGINATION_NOTE, cohortForbiddenResponses } from './cohort-route-docs';
import { ItemResponse, PaginatedListResponse, errorResponses, jsonResponse } from '@api/utils/openapi/responses';

export const v1CohortsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the cohorts the automation actor can see: every cohort for an org admin, otherwise only cohorts the actor belongs to. ${PAGINATION_NOTE}`,
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohorts returned successfully', PaginatedListResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: errorResponses.forbidden
      }
    }),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listCohortsService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohorts');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a cohort. The automation actor (the key creator) is added as its tutor.',
      tags: ['Public API Cohorts'],
      responses: {
        201: jsonResponse('Cohort created successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: errorResponses.forbidden
      }
    }),
    validator('json', ZPublicApiCreateCohort),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const cohort = await createPublicApiCohortService(orgId, actorId, payload);

        return c.json({ success: true, data: cohort }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create cohort');
      }
    }
  )
  .route('/:cohortId/members', v1CohortMembersRouter)
  .route('/:cohortId/courses', v1CohortCoursesRouter)
  .route('/:cohortId/newsfeed', v1CohortNewsfeedRouter)
  .route('/:cohortId/goals', v1CohortGoalsRouter)
  .get(
    '/:cohortId',
    describeRoute({
      description: `Get a cohort. ${COHORT_MEMBER_RULE}`,
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort returned successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.member,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const cohort = await getPublicApiCohortService(orgId, actorId, params);

        return c.json({ success: true, data: cohort }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to get cohort');
      }
    }
  )
  .put(
    '/:cohortId',
    describeRoute({
      description: `Update a cohort. Send only the fields to change. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort updated successfully', ItemResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.team,
        404: { description: 'Cohort not found' }
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('json', ZPublicApiUpdateCohort),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const cohort = await updatePublicApiCohortService(orgId, actorId, params, payload);

        return c.json({ success: true, data: cohort }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update cohort');
      }
    }
  )
  .delete(
    '/:cohortId',
    describeRoute({
      description: `Permanently delete a cohort and its memberships, newsfeed, and goals. ${COHORT_TEAM_RULE}`,
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort deleted successfully', ItemResponse),
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
        const cohort = await deletePublicApiCohortService(orgId, actorId, params);

        return c.json({ success: true, data: cohort }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete cohort');
      }
    }
  );
