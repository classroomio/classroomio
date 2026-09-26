import {
  ZPublicApiCourseInviteParam,
  ZPublicApiCourseInviteRevokeParam,
  ZPublicApiCourseInviteListItemResponse,
  ZPublicApiCourseInvitesQuery,
  ZPublicApiCreateCourseInvite,
  ZPublicApiCreateCourseInviteResponse,
  ZPublicApiRevokeCourseInviteResponse
} from '@cio/utils/validation/public-api';
import {
  createCourseInviteService,
  listCourseInvitesService,
  revokeCourseInviteService
} from '@api/services/v1/course-invite';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '@api/services/v1/shared';
import type { Context, Next } from 'hono';

const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403.';

const mcpRateLimitResponse = { description: 'MCP keys only: the per-key or per-organization MCP rate limit was hit' };
const forbiddenResponse = {
  description:
    'The key lacks the public_api:* or course:member:read/write scope, or the automation actor is not a course tutor/admin or org admin'
};

const requireCourseTeamActor = async (c: Context, next: Next) => {
  try {
    const courseId = c.req.param('courseId')!;
    await assertCourseBelongsToOrganization(c.get('orgId')!, courseId);
    await assertCourseTeamMemberOrOrgAdmin(courseId, c.get('actorId'));
  } catch (error) {
    return handlePublicApiError(c, error, 'Failed to create course invite');
  }

  await next();
};

const createInviteRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 60,
  message: 'Too many invite creation attempts. Please try again later.',
  keyGenerator: (c) => `course_invite_create:user:${c.get('actorId')}:${c.req.param('courseId')}`
});

export const v1CourseInvitesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List invites for a course, of any status (active, revoked, expired, or used up). ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse(
          'Course invites returned successfully',
          paginatedResponse(ZPublicApiCourseInviteListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseInviteParam),
    validator('query', ZPublicApiCourseInvitesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listCourseInvitesService(orgId, actorId, params, query);

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
      description: `Invite one or more people to a course by email or CSV. Unlike POST /members, this can onboard someone who is not yet an organization member. Set sendEmail to false to mint invite tokens without emailing recipients. Limited to 60 invite requests per hour per key creator per course, shared with the dashboard. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        201: jsonResponse('Course invite created successfully', itemResponse(ZPublicApiCreateCourseInviteResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        404: { description: 'Course not found' },
        429: { description: 'Too many invite creation attempts, or (MCP keys) the MCP rate limit was hit' }
      }
    }),
    validator('param', ZPublicApiCourseInviteParam),
    requireCourseTeamActor,
    createInviteRateLimit,
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
      description: `Revoke a pending course invite. The invite link stops working and this cannot be undone. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse('Course invite revoked successfully', itemResponse(ZPublicApiRevokeCourseInviteResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
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
