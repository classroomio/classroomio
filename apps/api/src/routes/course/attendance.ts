import { Hono } from '@api/utils/hono';
import { ZAttendanceBulkUpsert, ZAttendanceUpsert, ZLessonCheckInCodeParam } from '@cio/utils/validation/attendance';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { bulkUpsertAttendanceService, upsertAttendanceService } from '@api/services/attendance/attendance';
import {
  createLessonCheckInCode,
  getActiveLessonCheckInCode,
  revokeLessonCheckInCode
} from '@api/services/attendance/check-in';
import { zValidator } from '@hono/zod-validator';

export const attendanceRouter = new Hono()
  /**
   * POST /course/:courseId/attendance
   * Records one learner's attendance for a lesson. Accepts `status` (present, absent, late) or the legacy `isPresent`.
   */
  .post('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZAttendanceUpsert), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');
      const attendance = await upsertAttendanceService(courseId, data);

      return c.json({ success: true, data: attendance }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to upsert attendance');
    }
  })
  /**
   * PUT /course/:courseId/attendance/bulk
   * Records attendance for several learners of one lesson in one transaction.
   */
  .put('/bulk', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZAttendanceBulkUpsert), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');
      const attendance = await bulkUpsertAttendanceService(courseId, data);

      return c.json({ success: true, data: attendance }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save attendance');
    }
  })
  /**
   * GET /course/:courseId/attendance/:lessonId/check-in-code
   * The lesson's unexpired check-in code, or null.
   */
  .get(
    '/:lessonId/check-in-code',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonCheckInCodeParam),
    async (c) => {
      try {
        const { courseId, lessonId } = c.req.valid('param');
        const data = await getActiveLessonCheckInCode(courseId, lessonId);

        c.header('Cache-Control', 'no-store');

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load check-in code');
      }
    }
  )
  /**
   * POST /course/:courseId/attendance/:lessonId/check-in-code
   * Issues a new check-in code for the lesson, replacing the current one.
   */
  .post(
    '/:lessonId/check-in-code',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonCheckInCodeParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, lessonId } = c.req.valid('param');
        const data = await createLessonCheckInCode(courseId, lessonId, user.id);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create check-in code');
      }
    }
  )
  /**
   * DELETE /course/:courseId/attendance/:lessonId/check-in-code
   * Revokes the lesson's check-in code.
   */
  .delete(
    '/:lessonId/check-in-code',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZLessonCheckInCodeParam),
    async (c) => {
      try {
        const { courseId, lessonId } = c.req.valid('param');
        const data = await revokeLessonCheckInCode(courseId, lessonId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to revoke check-in code');
      }
    }
  );
