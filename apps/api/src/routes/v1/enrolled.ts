import { ZPublicApiEnrolledQuery } from '@cio/utils/validation/public-api';
import { listEnrolledService } from '@api/services/v1/enrolled';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const PaginationSchema = {
  type: 'object' as const,
  properties: {
    page: { type: 'number' as const },
    limit: { type: 'number' as const },
    total: { type: 'number' as const },
    totalPages: { type: 'number' as const }
  },
  required: ['page', 'limit', 'total', 'totalPages']
};

const CountsSchema = {
  type: 'object' as const,
  properties: {
    inProgress: { type: 'number' as const },
    completed: { type: 'number' as const }
  },
  required: ['inProgress', 'completed']
};

const EnrolledListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: PaginationSchema,
    counts: CountsSchema
  },
  required: ['success', 'data', 'pagination', 'counts']
};

export const v1EnrolledRouter = new Hono().get(
  '/',
  describeRoute({
    description: "List a learner's enrolled courses and learning paths for the authenticated organization",
    tags: ['Public API Enrolled'],
    responses: {
      200: {
        description: 'Enrolled items returned successfully',
        content: {
          'application/json': {
            schema: EnrolledListResponse
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
      const query = c.req.valid('query');
      const result = await listEnrolledService(orgId, query);

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
