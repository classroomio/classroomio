import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZCourseMathNotationOverride } from '@cio/utils/validation/math';

import { getCourseMathNotationView, updateCourseMathNotationService } from '@api/services/math/notation';

export const courseMathNotationRouter = new Hono()
  .get('/', authMiddleware, courseTeamMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const courseId = c.req.param('courseId') as string;
      const view = await getCourseMathNotationView(orgId, courseId);

      return c.json({ success: true as const, data: view });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch course math notation settings');
    }
  })
  .put('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZCourseMathNotationOverride), async (c) => {
    try {
      const courseId = c.req.param('courseId') as string;
      const updated = await updateCourseMathNotationService(courseId, c.req.valid('json'));

      return c.json({ success: true as const, data: updated });
    } catch (error) {
      return handleError(c, error, 'Failed to update course math notation settings');
    }
  });
