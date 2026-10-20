import {
  ZPublicApiCohortListItemResponse,
  ZPublicApiCohortParam,
  ZPublicApiCohortResponse,
  ZPublicApiCohortsQuery,
  ZPublicApiCreateCohort,
  ZPublicApiEnrolledCohortResponse,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohort
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCohortService,
  deletePublicApiCohortService,
  getPublicApiCohortService,
  listCohortsService,
  listPublicApiEnrolledCohortsService,
  updatePublicApiCohortService
} from '@api/services/v1/cohorts/cohort';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, cohortForbiddenResponses } from './docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const CohortResponse = itemResponse(ZPublicApiCohortResponse);

export const v1CohortRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description:
        'List the cohorts the key creator can see: every cohort for an org admin, otherwise only the ones they belong to.',
      tags: ['Cohorts'],
      responses: {
        200: jsonResponse('Cohorts returned successfully', paginatedResponse(ZPublicApiCohortListItemResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.scope
      }
    }),
    validator('query', ZPublicApiCohortsQuery),
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
      description: 'Create a cohort, with the key creator added as its tutor.',
      tags: ['Cohorts'],
      responses: {
        201: jsonResponse('Cohort created successfully', CohortResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cohortForbiddenResponses.scope
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
  .get(
    '/enrolled',
    describeRoute({
      description: 'List the cohorts the key creator is enrolled in, with their role in each.',
      tags: ['Cohorts'],
      responses: {
        200: jsonResponse(
          "Cohorts the key creator is enrolled in, limited to the key's organization",
          paginatedResponse(ZPublicApiEnrolledCohortResponse)
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
        const result = await listPublicApiEnrolledCohortsService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list enrolled cohorts');
      }
    }
  )
  .get(
    '/:cohortId',
    describeRoute({
      description: `Get a cohort; ${COHORT_MEMBER_RULE}.`,
      tags: ['Cohorts'],
      responses: {
        200: jsonResponse('Cohort returned successfully', CohortResponse),
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
      description: `Update the fields you send on a cohort; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohorts'],
      responses: {
        200: jsonResponse('Cohort updated successfully', CohortResponse),
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
      description: `Permanently delete a cohort and its memberships, newsfeed, and goals; ${COHORT_TEAM_RULE}.`,
      tags: ['Cohorts'],
      responses: {
        200: jsonResponse('Cohort deleted successfully', CohortResponse),
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
