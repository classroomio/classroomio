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
} from '@api/services/v1/courses/invites';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { getEventSource } from '@api/utils/event-source';
import { describeRoute, validator } from 'hono-openapi';
import { createCourseInviteRateLimit } from '@api/middlewares/course-invite-rate-limit';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, forbiddenResponse, inviteRateLimitUnavailableResponse, mcpRateLimitResponse } from './docs';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin } from '@api/services/v1/shared';
import type { Context, Next } from 'hono';

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

const createInviteRateLimit = createCourseInviteRateLimit((c) => ({ userId: c.get('actorId')! }), {
  failClosed: true
});

export const v1CourseInvitesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's invites of any status (active, revoked, expired or used up); ${COURSE_TEAM_RULE}.`,
      tags: ['Course Invites'],
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
      description: `Invite one or more people to a course by email or CSV, including people not yet in your organization; ${COURSE_TEAM_RULE}.`,
      tags: ['Course Invites'],
      responses: {
        201: jsonResponse('Course invite created successfully', itemResponse(ZPublicApiCreateCourseInviteResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        404: { description: 'Course not found' },
        429: {
          description:
            'The key creator made 60 invite requests for this course in the past hour, counting the dashboard and new-student enrollments; or an MCP key hit its rate limit'
        },
        503: inviteRateLimitUnavailableResponse
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
        const invite = await createCourseInviteService(orgId, actorId, params, payload, getEventSource(c));

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
      description: `Revoke a pending course invite so its link stops working, which cannot be undone; ${COURSE_TEAM_RULE}.`,
      tags: ['Course Invites'],
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
