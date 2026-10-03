import { ZPublicApiLearningPathParam, ZPublicApiPathMembersQuery } from '@cio/utils/validation/public-api';
import { listPublicApiLearningPathMembersService } from '@api/services/v1/learning-paths';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

import { PathMembersResponseSchema } from './docs';

export const v1LearningPathMembersRouter = new Hono().get(
  '/:pathId/members',
  describeRoute({
    description: 'List members of a learning path, paged with optional search and role filter',
    tags: ['Public API Learning Paths'],
    responses: {
      200: {
        description: 'Path members returned successfully',
        content: {
          'application/json': {
            schema: PathMembersResponseSchema
          }
        }
      },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Learning path not found' }
    }
  }),
  validator('param', ZPublicApiLearningPathParam),
  validator('query', ZPublicApiPathMembersQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const params = c.req.valid('param');
      const query = c.req.valid('query');
      const members = await listPublicApiLearningPathMembersService(orgId, actorId, params, query);

      return c.json(
        {
          success: true,
          data: members.data,
          pagination: members.pagination
        },
        200
      );
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list learning path members');
    }
  }
);
