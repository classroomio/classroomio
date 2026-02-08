import { ZCourseContentDelete, ZCourseContentUpdate } from '@cio/utils/validation/course';
import { deleteCourseContent, updateCourseContent } from '@api/services/course/content';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const contentRouter = new Hono()
  .put('/', courseTeamMemberMiddleware, zValidator('json', ZCourseContentUpdate), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { items } = c.req.valid('json');

      await updateCourseContent(courseId, items);

      return c.json({ success: true }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update course content');
    }
  })
  .delete('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZCourseContentDelete), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const payload = c.req.valid('json');

      await deleteCourseContent(courseId, payload);

      return c.json({ success: true }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete course content');
    }
  });
