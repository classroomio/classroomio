import { ZCourseContentDelete, ZCourseContentReorder, ZCourseContentUpdate } from '@cio/utils/validation/course';
import { deleteCourseContent, reorderCourseContent, updateCourseContent } from '@cio/core/services/course/content';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberOrAutomationKeyMiddleware } from '@api/middlewares/course-team-member-or-automation-key';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const contentRouter = new Hono()
  .put(
    '/reorder',
    authOrAutomationKeyMiddleware,
    courseTeamMemberOrAutomationKeyMiddleware(['course:write']),
    zValidator('json', ZCourseContentReorder),
    async (c) => {
      try {
        const courseId = c.req.param('courseId')!;
        const automationKey = c.get('automationKey');
        const payload = c.req.valid('json');

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'reorder_course_content');
        }

        const result = await reorderCourseContent(courseId, payload);

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'reorder_course_content', {
            courseId,
            sectionCount: payload.sections?.length ?? 0,
            itemCount: payload.items?.length ?? 0
          });
        }

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reorder course content');
      }
    }
  )
  .put('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZCourseContentUpdate), async (c) => {
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
