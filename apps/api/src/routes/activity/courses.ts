import { ZActivityCoursesCreate } from '@cio/utils/validation/activity/course';
import { createCoursesFromPackages } from '@cio/core/services/activity/courses';
import { assertActivityKindAllowed } from '@api/services/activity/plan';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const activityCoursesRouter = new Hono().post(
  '/',
  authMiddleware,
  orgAdminMiddleware,
  zValidator('json', ZActivityCoursesCreate),
  async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');
      await assertActivityKindAllowed(orgId, 'scorm');
      const result = await createCoursesFromPackages(orgId, user.id, data);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create courses from packages');
    }
  }
);
