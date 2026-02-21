import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { getMarks } from '@api/services/mark';
import { handleError } from '@api/utils/errors';

export const markRouter = new Hono().get('/', authMiddleware, courseMemberMiddleware, async (c) => {
  try {
    const courseId = c.req.param('courseId')!;
    const marks = await getMarks(courseId);

    return c.json({ success: true, data: marks }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to get marks');
  }
});
