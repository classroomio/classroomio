import {
  ZAddCourseMembers,
  ZCourseMembersMemberParam,
  ZCourseMembersParam,
  ZUpdateCourseMember
} from '@cio/utils/validation/course/people';
import { addMembers, deleteMember, listCourseMembers, updateMember } from '@api/services/course/people';

import { Hono } from '@api/utils/hono';
import { ZCourseUserAnalyticsParam } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { getUserCourseAnalytics } from '@api/services/course/course';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const membersRouter = new Hono()
  /**
   * GET /course/:courseId/members
   * Gets all course members for a course
   * Requires authentication and course team membership (admin/tutor role)
   */
  .get('/', authMiddleware, courseTeamMemberMiddleware, zValidator('param', ZCourseMembersParam), async (c) => {
    try {
      const { courseId } = c.req.valid('param');
      const members = await listCourseMembers(courseId);

      return c.json(
        {
          success: true,
          data: members
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch course members');
    }
  })
  /**
   * POST /course/:courseId/members
   * Adds one or more course members to a course
   * Accepts either a single member (ZAddCourseMember) or multiple members (ZAddCourseMembers)
   * Requires authentication and course team membership (admin/tutor role)
   */
  .post(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseMembersParam),
    zValidator('json', ZAddCourseMembers),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const members = c.req.valid('json');

        const addedMembers = await addMembers(courseId, members);

        return c.json(
          {
            success: true,
            data: addedMembers
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to add course member(s)');
      }
    }
  )
  /**
   * PUT /course/:courseId/members/:memberId
   * Updates a course member
   * Requires authentication and course team membership (admin/tutor role)
   */
  .put(
    '/:memberId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseMembersMemberParam),
    zValidator('json', ZUpdateCourseMember),
    async (c) => {
      try {
        const { courseId, memberId } = c.req.valid('param');
        const validatedData = c.req.valid('json');

        const member = await updateMember(courseId, memberId, validatedData);

        return c.json(
          {
            success: true,
            data: member
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update course member');
      }
    }
  )
  /**
   * DELETE /course/:courseId/members/:memberId
   * Deletes a course member
   * Requires authentication and course team membership (admin/tutor role)
   */
  .delete(
    '/:memberId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseMembersMemberParam),
    async (c) => {
      try {
        const { courseId, memberId } = c.req.valid('param');
        const member = await deleteMember(courseId, memberId);

        return c.json(
          {
            success: true,
            data: member
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to delete course member');
      }
    }
  )
  /**
   * GET /course/:courseId/members/:userId/analytics
   * Gets user course analytics for a specific course
   * Requires authentication and course membership
   */
  .get(
    '/:userId/analytics',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseUserAnalyticsParam),
    async (c) => {
      try {
        const { courseId, userId } = c.req.valid('param');
        const analytics = await getUserCourseAnalytics(courseId, userId);

        return c.json(
          {
            success: true,
            data: analytics
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch user course analytics');
      }
    }
  );
