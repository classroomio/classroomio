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

import { AUDIENCE_IMPORT_MAX_ROWS } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { getEventSource } from '@api/utils/event-source';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from './courses/docs';
import { ORG_ADMIN_FORBIDDEN, ORG_ADMIN_RULE } from './team/docs';

const AudienceListEnvelope = z.object({ query: ZPublicApiAudienceQuery });

const forbidden = (scope: 'audience:read' | 'audience:write') => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or ${ORG_ADMIN_FORBIDDEN}`
});

const audienceWriteForbidden = forbidden('audience:write');

const createAudienceForbidden = {
  description: `${audienceWriteForbidden.description} Also returned with UPGRADE_REQUIRED when the Free plan student limit is reached while the request runs.`
};

export const v1AudienceRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's audience members; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        200: jsonResponse(
          'Audience members returned successfully',
          paginatedResponse(ZPublicApiAudienceMemberResponse, AudienceListEnvelope)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbidden('audience:read'),
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiAudienceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const audience = await listAudienceService(orgId, actorId, query);

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
      description: `Invite one person (email) or up to ${AUDIENCE_IMPORT_MAX_ROWS} (emails) to the organization as students; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        201: jsonResponse(
          'Invites processed. rows has one entry per address, in order, with what happened to it',
          itemResponse(ZPublicApiCreateAudienceResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: createAudienceForbidden,
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiCreateAudience),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const result = await createAudienceService(orgId, actorId, payload, getEventSource(c));

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
      description: `Assign one or more audience members to one or more courses or cohorts; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        200: jsonResponse(
          'Audience members assigned to courses successfully',
          itemResponse(ZPublicApiAssignAudienceCoursesResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbidden('audience:write'),
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiAssignAudienceCourses),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const result = await assignAudienceCoursesService(orgId, actorId, payload, getEventSource(c));

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
      description: `Get an audience member; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        200: jsonResponse('Audience member returned successfully', itemResponse(ZPublicApiAudienceMemberResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbidden('audience:read'),
        404: { description: 'Audience member not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiAudienceMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const audienceMember = await getAudienceMemberService(orgId, actorId, params);

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
      description: `Remove an audience member; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        200: jsonResponse(
          'Organization membership deleted and pending invites revoked; the person keeps their account',
          itemResponse(ZPublicApiRemoveAudienceMemberResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbidden('audience:write'),
        404: { description: 'Audience member not found' },
        429: mcpRateLimitResponse
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
      description: `Update a pending audience member's email or a joined member's name; ${ORG_ADMIN_RULE}.`,
      tags: ['Audience'],
      responses: {
        200: jsonResponse('Audience member updated successfully', itemResponse(ZPublicApiAudienceMemberResponse)),
        400: {
          description:
            'Invalid path or body, no fields to update, an email change on a joined member, or a name change on a pending member'
        },
        401: errorResponses.unauthorized,
        403: forbidden('audience:write'),
        404: { description: 'Audience member not found' },
        409: { description: 'Another member of the organization already has this email' },
        429: mcpRateLimitResponse
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
