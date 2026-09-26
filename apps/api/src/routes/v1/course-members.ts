import {
  ZPublicApiAddCourseMember,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseMemberAnalyticsResponse,
  ZPublicApiCourseMemberDetailResponse,
  ZPublicApiCourseMemberListItemResponse,
  ZPublicApiCourseMemberParam,
  ZPublicApiCourseMemberProgressResetResponse,
  ZPublicApiCourseMemberResponse,
  ZPublicApiCourseMembersQuery,
  ZPublicApiCourseParam,
  ZPublicApiUpdateCourseMember
} from '@cio/utils/validation/public-api';
import {
  addCourseMemberService,
  deleteCourseMemberService,
  getCourseMemberAnalyticsService,
  getCourseMemberService,
  listCourseMembersService,
  resetCourseMemberProgressService,
  updateCourseMemberService
} from '@api/services/v1/course-member';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403.';

const mcpRateLimitResponse = { description: 'MCP keys only: the per-key or per-organization MCP rate limit was hit' };
const forbiddenResponse = {
  description:
    'The key lacks the public_api:* or course:member:read/write scope, or the automation actor is not a course tutor/admin or org admin'
};

const MemberResponse = itemResponse(ZPublicApiCourseMemberResponse);

export const v1CourseMembersRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List everyone with access to a course (students and tutors), with role and progress. This is a superset of GET /courses/{courseId}/students, which returns only students. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse(
          'Course members returned successfully',
          paginatedResponse(ZPublicApiCourseMemberListItemResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseMembersQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listCourseMembersService(orgId, actorId, params, query);

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
        return handlePublicApiError(c, error, 'Failed to list course members');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Give someone access to this course, the same as adding a member in the dashboard. The profileId or email must belong to someone already in your organization; an email is linked to that person's profile. To onboard someone new, use the invites endpoints. Added tutors/admins with an email and name get a welcome email. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        201: jsonResponse('Course member added successfully', MemberResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course not found, or the profileId or email is not in your organization' },
        409: { description: 'Already a member of this course' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiAddCourseMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await addCourseMemberService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: member
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add course member');
      }
    }
  )
  .get(
    '/:memberId',
    describeRoute({
      description: `Get a single course member's detail. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse('Course member returned successfully', itemResponse(ZPublicApiCourseMemberDetailResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const member = await getCourseMemberService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: member
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course member');
      }
    }
  )
  .put(
    '/:memberId',
    describeRoute({
      description: `Change a course member's role or email. Send only the fields to change. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse('Course member updated successfully', MemberResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course or member not found' },
        409: { description: 'The new email is already used by another member of this course' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    validator('json', ZPublicApiUpdateCourseMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await updateCourseMemberService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: member
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course member');
      }
    }
  )
  .delete(
    '/:memberId',
    describeRoute({
      description: `Remove someone's access to the course. This permanently deletes the course membership; the person keeps their account and organization membership. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse('Course member removed successfully', MemberResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const member = await deleteCourseMemberService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: member
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove course member');
      }
    }
  )
  .post(
    '/:memberId/reset-progress',
    describeRoute({
      description: `Clear a student's completion progress while keeping them enrolled. This cannot be undone. Only student members can have their progress reset. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse(
          'Course member progress reset successfully',
          itemResponse(ZPublicApiCourseMemberProgressResetResponse)
        ),
        400: { description: 'Invalid path or query, or the member is not a student' },
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const summary = await resetCourseMemberProgressService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: summary
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reset course member progress');
      }
    }
  )
  .get(
    '/:memberId/analytics',
    describeRoute({
      description: `Fetch a student's progress and grade analytics for the course. Only student members have analytics. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: jsonResponse(
          'Course member analytics returned successfully',
          itemResponse(ZPublicApiCourseMemberAnalyticsResponse)
        ),
        400: { description: 'Invalid path or query, or the member is not a student' },
        401: errorResponses.unauthorized,
        403: forbiddenResponse,
        429: mcpRateLimitResponse,
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    validator('query', ZPublicApiCourseMemberAnalyticsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const analytics = await getCourseMemberAnalyticsService(orgId, actorId, params, query);

        return c.json(
          {
            success: true,
            data: analytics
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course member analytics');
      }
    }
  );
