import {
  ZPublicApiAddCourseMember,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseMemberParam,
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

const COURSE_TEAM_RULE =
  'The automation actor (the key creator) must be a course tutor/admin or an org admin, or this fails with 403.';

const badRequestResponse = { description: 'Invalid path, query, or body' };
const unauthorizedResponse = { description: 'Missing or invalid API key, or the key has no actor' };
const forbiddenResponse = {
  description: 'The key lacks the public_api:* scope, or the automation actor is not a course tutor/admin or org admin'
};

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

const CourseMembersListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: PaginationSchema
  },
  required: ['success', 'data', 'pagination']
};

const CourseMemberDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

export const v1CourseMembersRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List everyone with access to a course (students and tutors), with role and progress. This is a superset of GET /courses/{courseId}/students, which returns only students. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        200: {
          description: 'Course members returned successfully',
          content: {
            'application/json': {
              schema: CourseMembersListResponse
            }
          }
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
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
      description: `Give someone access to this course, the same as adding a member in the dashboard. A profileId must belong to someone already in your organization; to onboard someone new with an invite email, use the invites endpoints. Added tutors/admins with an email and name get a welcome email. ${COURSE_TEAM_RULE}`,
      tags: ['Public API Course Members'],
      responses: {
        201: {
          description: 'Course member added successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: { description: 'Course not found, or the profileId is not in your organization' },
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
        200: {
          description: 'Course member returned successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
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
        200: {
          description: 'Course member updated successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
        404: { description: 'Course or member not found' }
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
        200: {
          description: 'Course member removed successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: badRequestResponse,
        401: unauthorizedResponse,
        403: forbiddenResponse,
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
        200: {
          description: 'Course member progress reset successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: { description: 'Invalid path or query, or the member is not a student' },
        401: unauthorizedResponse,
        403: forbiddenResponse,
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
        200: {
          description: 'Course member analytics returned successfully',
          content: {
            'application/json': {
              schema: CourseMemberDetailResponse
            }
          }
        },
        400: { description: 'Invalid path or query, or the member is not a student' },
        401: unauthorizedResponse,
        403: forbiddenResponse,
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
