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
      description:
        "List everyone with access to a course (students and tutors), with role and progress. This is a superset of GET /courses/{courseId}/students, which returns only students.",
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
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseMembersQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listCourseMembersService(orgId, params, query);

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
      description:
        "Grant an existing organization member access to this course. The person must already be an organization member/audience member — this does not create one. Use the invites endpoints to onboard someone new. Adding a student sends a welcome email and notifies the course's tutors; there is no opt-out for this on member add.",
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
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiAddCourseMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await addCourseMemberService(orgId, params, payload);

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
      description: "Get a single course member's detail",
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
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const member = await getCourseMemberService(orgId, params);

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
      description: "Change a course member's role",
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
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    validator('json', ZPublicApiUpdateCourseMember),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const member = await updateCourseMemberService(orgId, params, payload);

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
      description: "Remove someone's access to the course",
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
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const member = await deleteCourseMemberService(orgId, params);

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
      description: "Clear a student's completion progress while keeping them enrolled. Only student members can have their progress reset.",
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
        400: { description: 'Member is not a student' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
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
      description: "Fetch a student's progress and grade analytics for the course. Only student members have analytics.",
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
        400: { description: 'Member is not a student' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course or member not found' }
      }
    }),
    validator('param', ZPublicApiCourseMemberParam),
    validator('query', ZPublicApiCourseMemberAnalyticsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const analytics = await getCourseMemberAnalyticsService(orgId, params, query);

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
