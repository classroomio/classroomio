import {
  ZPublicApiCreateLearningPath,
  ZPublicApiLearningPathParam,
  ZPublicApiLearningPathsQuery,
  ZPublicApiUpdateLearningPath
} from '@cio/utils/validation/public-api';
import {
  createPublicApiLearningPathService,
  deletePublicApiLearningPathService,
  getLearningPathService,
  listLearningPathsService,
  updatePublicApiLearningPathService
} from '../../../services/v1/learning-paths';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

import { LearningPathDetailResponseSchema, LearningPathResponseSchema, LearningPathsListResponseSchema } from './docs';

export const v1LearningPathRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List learning paths for the authenticated organization',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning paths returned successfully',
          content: {
            'application/json': {
              schema: LearningPathsListResponseSchema
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('query', ZPublicApiLearningPathsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const paths = await listLearningPathsService(orgId, actorId, query);

        return c.json(
          {
            success: true,
            data: paths.data,
            pagination: paths.pagination
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list learning paths');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a learning path for the authenticated organization',
      tags: ['Public API Learning Paths'],
      responses: {
        201: {
          description: 'Learning path created successfully',
          content: {
            'application/json': {
              schema: LearningPathResponseSchema
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('json', ZPublicApiCreateLearningPath),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const path = await createPublicApiLearningPathService(orgId, actorId, payload);

        return c.json(
          {
            success: true,
            data: path
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create learning path');
      }
    }
  )
  .get(
    '/:pathId',
    describeRoute({
      description: 'Get a single learning path by id, with ordered course ids',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path returned successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponseSchema
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const path = await getLearningPathService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch learning path');
      }
    }
  )
  .patch(
    '/:pathId',
    describeRoute({
      description: 'Update a learning path by id',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path updated successfully',
          content: {
            'application/json': {
              schema: LearningPathResponseSchema
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    validator('json', ZPublicApiUpdateLearningPath),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const path = await updatePublicApiLearningPathService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update learning path');
      }
    }
  )
  .delete(
    '/:pathId',
    describeRoute({
      description: 'Delete a learning path by id',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path deleted successfully',
          content: {
            'application/json': {
              schema: LearningPathResponseSchema
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const path = await deletePublicApiLearningPathService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete learning path');
      }
    }
  );
