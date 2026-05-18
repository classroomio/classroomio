import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZCourseAiTutorOverride } from '@cio/utils/validation/agent';

import { getCourseAiTutorSettingsView, updateCourseAiTutorOverrideService } from '@api/services/agent/tutor-config';

/**
 * Per-course AI tutor override.
 *
 * GET /course/:courseId/ai-tutor → { org, override, effective }
 * PUT /course/:courseId/ai-tutor → updates the per-course override slot.
 * Mounted at /course/:courseId/ai-tutor.
 */
export const courseAiTutorRouter = new Hono()
  .get('/', authMiddleware, courseTeamMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const courseId = c.req.param('courseId') as string;
      const view = await getCourseAiTutorSettingsView(orgId, courseId);

      return c.json({ success: true as const, data: view });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch course AI tutor settings');
    }
  })
  .put('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZCourseAiTutorOverride), async (c) => {
    try {
      const courseId = c.req.param('courseId') as string;
      const patch = c.req.valid('json');
      const updated = await updateCourseAiTutorOverrideService(courseId, patch);

      return c.json({ success: true as const, data: updated });
    } catch (error) {
      return handleError(c, error, 'Failed to update course AI tutor override');
    }
  });
