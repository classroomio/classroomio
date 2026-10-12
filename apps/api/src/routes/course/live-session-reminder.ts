import { Hono } from '@api/utils/hono';
import { ZCourseGetParam, ZLiveSessionReminderDeliveriesQuery } from '@cio/utils/validation/course';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { listLiveSessionReminderDeliveries } from '@api/services/course/live-session-reminder';
import { zValidator } from '@hono/zod-validator';

export const liveSessionReminderRouter = new Hono()
  /**
   * GET /course/:courseId/live-session-reminders/deliveries
   * One page of reminder email deliveries for the course's live sessions. Requires course team membership.
   */
  .get(
    '/deliveries',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseGetParam),
    zValidator('query', ZLiveSessionReminderDeliveriesQuery),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listLiveSessionReminderDeliveries(courseId, query);
        const pagination = {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        };

        return c.json({ success: true, data: result.items, pagination }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch live session reminder deliveries');
      }
    }
  );
