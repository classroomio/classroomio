import { Hono } from '@api/utils/hono';
import { ZCourseGetParam } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { getCoursePermissions } from '@api/services/course/permissions';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const permissionsRouter = new Hono()
  /**
   * GET /course/:courseId/permissions
   * Gets user permissions for a course
   * Requires authentication
   */
  .get('/:courseId/permissions', authMiddleware, zValidator('param', ZCourseGetParam), async (c) => {
    try {
      const { courseId } = c.req.valid('param');
      const user = c.get('user')!;

      const permissions = await getCoursePermissions(courseId, user.id);

      return c.json(
        {
          success: true,
          data: permissions
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to get course permissions');
    }
  });
