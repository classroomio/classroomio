import { ZPublicApiEnrolledQuery } from '@cio/utils/validation/public-api';
import { listEnrolledService } from '@api/services/v1/enrolled';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

import { EnrolledListResponseSchema } from './docs';

export const v1EnrolledRouter = new Hono().get(
  '/',
  describeRoute({
    description:
      "List the API key creator's own enrolled courses and learning paths. `counts` splits the search-filtered rows into in-progress vs completed for the tab labels.",
    tags: ['Public API Enrolled'],
    responses: {
      200: {
        description: 'Enrolled items returned successfully',
        content: {
          'application/json': {
            schema: EnrolledListResponseSchema
          }
        }
      },
      400: { description: 'Invalid request query' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' }
    }
  }),
  validator('query', ZPublicApiEnrolledQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const query = c.req.valid('query');
      const result = await listEnrolledService(orgId, actorId, query);

      return c.json(
        {
          success: true,
          data: result.data,
          pagination: result.pagination,
          counts: result.counts
        },
        200
      );
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list enrolled items');
    }
  }
);
