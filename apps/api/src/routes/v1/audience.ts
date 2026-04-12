import {
  ZPublicApiAssignAudienceCourses,
  ZPublicApiAudienceMemberParam,
  ZPublicApiAudienceQuery,
  ZPublicApiCreateAudience,
  ZPublicApiUpdateAudience
} from '@cio/utils/validation/public-api';
import {
  assignAudienceCoursesService,
  createAudienceService,
  getAudienceMemberService,
  listAudienceService,
  removeAudienceService,
  updateAudienceService
} from '@api/services/v1/audience';

import { Hono } from '@api/utils/hono';
import { automationKeyMiddleware } from '@api/middlewares/automation-key';
import { automationKeyScopesMiddleware } from '@api/middlewares/automation-key-scopes';
import { handleError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const AudienceListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: { type: 'object' as const },
    query: { type: 'object' as const }
  },
  required: ['success', 'data', 'pagination', 'query']
};

const AudienceMutationResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const AudienceDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

export const v1AudienceRouter = new Hono()
  .get(
    '/',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'List audience members for the authenticated organization',
      tags: ['Public API Audience'],
      responses: {
        200: {
          description: 'Audience members returned successfully',
          content: {
            'application/json': {
              schema: AudienceListResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('query', ZPublicApiAudienceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const query = c.req.valid('query');
        const audience = await listAudienceService(orgId, query);

        return c.json(
          {
            success: true,
            data: audience.items,
            pagination: audience.pagination,
            query: audience.query
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to list audience members');
      }
    }
  )
  .post(
    '/',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Create an audience member invitation for the authenticated organization',
      tags: ['Public API Audience'],
      responses: {
        201: {
          description: 'Audience member created successfully',
          content: {
            'application/json': {
              schema: AudienceMutationResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('json', ZPublicApiCreateAudience),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const result = await createAudienceService(orgId, actorId, payload);

        return c.json(
          {
            success: true,
            data: result
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create audience member');
      }
    }
  )
  .post(
    '/assign-courses',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Assign one or more audience members to one or more courses',
      tags: ['Public API Audience'],
      responses: {
        200: {
          description: 'Audience members assigned to courses successfully',
          content: {
            'application/json': {
              schema: AudienceMutationResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('json', ZPublicApiAssignAudienceCourses),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const payload = c.req.valid('json');
        const result = await assignAudienceCoursesService(orgId, payload);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to assign audience to courses');
      }
    }
  )
  .get(
    '/:memberId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Get a single audience member by id',
      tags: ['Public API Audience'],
      responses: {
        200: {
          description: 'Audience member returned successfully',
          content: {
            'application/json': {
              schema: AudienceDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Audience member not found' }
      }
    }),
    validator('param', ZPublicApiAudienceMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const audienceMember = await getAudienceMemberService(orgId, params);

        return c.json(
          {
            success: true,
            data: audienceMember
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch audience member');
      }
    }
  )
  .delete(
    '/:memberId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Remove an audience member by id',
      tags: ['Public API Audience'],
      responses: {
        200: {
          description: 'Audience member removed successfully',
          content: {
            'application/json': {
              schema: AudienceMutationResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Audience member not found' }
      }
    }),
    validator('param', ZPublicApiAudienceMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const { memberId } = c.req.valid('param');
        const result = await removeAudienceService(orgId, memberId, actorId);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to remove audience member');
      }
    }
  )
  .put(
    '/:memberId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Update a pending audience member email address',
      tags: ['Public API Audience'],
      responses: {
        200: {
          description: 'Audience member updated successfully',
          content: {
            'application/json': {
              schema: AudienceDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Audience member not found' }
      }
    }),
    validator('param', ZPublicApiAudienceMemberParam),
    validator('json', ZPublicApiUpdateAudience),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const { memberId } = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await updateAudienceService(orgId, memberId, actorId, payload);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update audience member');
      }
    }
  );
