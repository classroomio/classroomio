import {
  ZPublicApiCourseInviteParam,
  ZPublicApiCourseInviteRevokeParam,
  ZPublicApiCourseInvitesQuery,
  ZPublicApiCreateCourseInvite
} from '@cio/utils/validation/public-api';
import {
  createCourseInviteService,
  listCourseInvitesService,
  revokeCourseInviteService
} from '@api/services/v1/course-invite';

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

const CourseInvitesListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: PaginationSchema
  },
  required: ['success', 'data', 'pagination']
};

const CourseInviteDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

export const v1CourseInvitesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List pending invites for a course',
      tags: ['Public API Course Members'],
      responses: {
        200: {
          description: 'Course invites returned successfully',
          content: {
            'application/json': {
              schema: CourseInvitesListResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseInviteParam),
    validator('query', ZPublicApiCourseInvitesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listCourseInvitesService(orgId, params, query);

        return c.json(
          {
            success: true,
            data: result.items,
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              totalPages: result.totalPages
            }
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course invites');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description:
        'Invite one or more people to a course by email or CSV. Unlike POST /members, this can onboard someone who is not yet an organization member. Set sendEmail to false to mint invite tokens without emailing recipients.',
      tags: ['Public API Course Members'],
      responses: {
        201: {
          description: 'Course invite created successfully',
          content: {
            'application/json': {
              schema: CourseInviteDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseInviteParam),
    validator('json', ZPublicApiCreateCourseInvite),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const invite = await createCourseInviteService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: invite
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create course invite');
      }
    }
  )
  .post(
    '/:inviteId/revoke',
    describeRoute({
      description: 'Revoke a pending course invite',
      tags: ['Public API Course Members'],
      responses: {
        200: {
          description: 'Course invite revoked successfully',
          content: {
            'application/json': {
              schema: CourseInviteDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or invite not found' }
      }
    }),
    validator('param', ZPublicApiCourseInviteRevokeParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const revoked = await revokeCourseInviteService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: revoked
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to revoke course invite');
      }
    }
  );
