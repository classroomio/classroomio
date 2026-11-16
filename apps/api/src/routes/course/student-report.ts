import {
  ZStudentReportCreate,
  ZStudentReportListQuery,
  ZStudentReportParam
} from '@cio/utils/validation/student-report';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import {
  createStudentReportsService,
  listStudentReportsService,
  revokeStudentReportService
} from '@api/services/student-report/student-report';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { zValidator } from '@hono/zod-validator';

const createReportRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  message: 'Too many reports. Please try again shortly.',
  keyGenerator: (c) => `student_report_create:${c.get('user')?.id ?? 'anonymous'}`
});

export const courseStudentReportRouter = new Hono()
  .get('/', authMiddleware, courseTeamMemberMiddleware, zValidator('query', ZStudentReportListQuery), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { profileId } = c.req.valid('query');
      const data = await listStudentReportsService(courseId, profileId);

      return c.json({ success: true as const, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list reports');
    }
  })
  .post(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    createReportRateLimit,
    zValidator('json', ZStudentReportCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const orgId = await getOrgIdByCourseId(courseId);
        if (!orgId) throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);

        const data = await createStudentReportsService(courseId, orgId, user.id, c.req.valid('json'));

        return c.json({ success: true as const, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create reports');
      }
    }
  )
  .delete(
    '/:reportId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZStudentReportParam),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const { reportId } = c.req.valid('param');
        const data = await revokeStudentReportService(courseId, reportId);

        return c.json({ success: true as const, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to revoke report');
      }
    }
  );
