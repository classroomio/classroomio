import * as z from 'zod';
import {
  ZPublicApiAssignAudienceCourses,
  ZPublicApiAssignAudienceCoursesResponse,
  ZPublicApiAudienceMemberParam,
  ZPublicApiAudienceMemberResponse,
  ZPublicApiAudienceQuery,
  ZPublicApiCreateAudience,
  ZPublicApiCreateAudienceResponse,
  ZPublicApiRemoveAudienceMemberResponse,
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
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const AudienceListEnvelope = z.object({ query: ZPublicApiAudienceQuery });

export const v1AudienceRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List audience members for the authenticated organization',
      tags: ['Audience'],
      responses: {
        200: jsonResponse(
          'Audience members returned successfully',
          paginatedResponse(ZPublicApiAudienceMemberResponse, AudienceListEnvelope)
        ),
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
        return handlePublicApiError(c, error, 'Failed to list audience members');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create an audience member invitation for the authenticated organization',
      tags: ['Audience'],
      responses: {
        201: jsonResponse('Audience member created successfully', itemResponse(ZPublicApiCreateAudienceResponse)),
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
        return handlePublicApiError(c, error, 'Failed to create audience member');
      }
    }
  )
  .post(
    '/assign-courses',
    describeRoute({
      description: 'Assign one or more audience members to one or more courses',
      tags: ['Audience'],
      responses: {
        200: jsonResponse(
          'Audience members assigned to courses successfully',
          itemResponse(ZPublicApiAssignAudienceCoursesResponse)
        ),
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
        return handlePublicApiError(c, error, 'Failed to assign audience to courses');
      }
    }
  )
  .get(
    '/:memberId',
    describeRoute({
      description: 'Get a single audience member by id',
      tags: ['Audience'],
      responses: {
        200: jsonResponse('Audience member returned successfully', itemResponse(ZPublicApiAudienceMemberResponse)),
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
        return handlePublicApiError(c, error, 'Failed to fetch audience member');
      }
    }
  )
  .delete(
    '/:memberId',
    describeRoute({
      description: 'Remove an audience member by id',
      tags: ['Audience'],
      responses: {
        200: jsonResponse('Audience member removed successfully', itemResponse(ZPublicApiRemoveAudienceMemberResponse)),
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
        return handlePublicApiError(c, error, 'Failed to remove audience member');
      }
    }
  )
  .put(
    '/:memberId',
    describeRoute({
      description: 'Update a pending audience member email address',
      tags: ['Audience'],
      responses: {
        200: jsonResponse('Audience member updated successfully', itemResponse(ZPublicApiAudienceMemberResponse)),
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
        return handlePublicApiError(c, error, 'Failed to update audience member');
      }
    }
  );
