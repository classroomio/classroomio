import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { getGradebook } from '@api/services/mark/gradebook';
import { getMarks } from '@api/services/mark';
import { handleError } from '@api/utils/errors';

export const markRouter = new Hono()
  .get('/gradebook', authMiddleware, courseMemberMiddleware, async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const gradebook = await getGradebook(courseId);
      return c.json({ success: true, data: gradebook }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get gradebook');
    }
  })
  .get('/', authMiddleware, courseMemberMiddleware, async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const marks = await getMarks(courseId);

      return c.json({ success: true, data: marks }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get marks');
    }
  });
