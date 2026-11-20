import { ZPracticeCreate } from '@cio/utils/validation/practice';
import { createPracticeSetService } from '@api/services/practice/practice';
import { assertCourseHasPaidMathFeature } from '@api/services/math/premium';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const coursePracticeRouter = new Hono().post(
  '/',
  authMiddleware,
  courseTeamMemberMiddleware,
  zValidator('json', ZPracticeCreate),
  async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const orgId = await getOrgIdByCourseId(courseId);
      if (!orgId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

      await assertCourseHasPaidMathFeature(courseId, 'practice_assignment');

      const data = await createPracticeSetService(courseId, orgId, c.req.valid('json'));

      return c.json({ success: true as const, data }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create practice');
    }
  }
);
