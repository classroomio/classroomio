import { ZPublicApiCohortParam, ZPublicApiCreateCohort, ZPublicApiUpdateCohort } from '@cio/utils/validation/public-api';
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

const CohortResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const CohortListResponse = {
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

export const v1CohortsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List the cohorts in your organization',
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohorts returned successfully', CohortListResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const cohorts = await listCohortsService(orgId);

        return c.json({ success: true, data: cohorts }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohorts');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a cohort',
      tags: ['Public API Cohorts'],
      responses: {
        201: jsonResponse('Cohort created successfully', CohortResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
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
      description: 'Get a cohort',
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort returned successfully', CohortResponse),
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
        const cohort = await getPublicApiCohortService(orgId, params);

        return c.json({ success: true, data: cohort }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to get cohort');
      }
    }
  )
  .put(
    '/:cohortId',
    describeRoute({
      description: 'Update a cohort',
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort updated successfully', CohortResponse),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
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
      description: 'Delete a cohort',
      tags: ['Public API Cohorts'],
      responses: {
        200: jsonResponse('Cohort deleted successfully', CohortResponse),
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
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
