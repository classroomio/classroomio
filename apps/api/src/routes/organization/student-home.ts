import { ZStudentHomeCourseOptionsQuery } from '@cio/utils/validation/organization';
import { listStudentHomeOptions, resolveStudentHomePath } from '@api/services/organization/student-home';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const organizationStudentHomeRouter = new Hono()
  .get(
    '/courses',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('query', ZStudentHomeCourseOptionsQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const query = c.req.valid('query');
        const options = await listStudentHomeOptions(orgId, query);

        return c.json({ success: true, data: options }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list student home courses');
      }
    }
  )
  .get('/resolve', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const path = await resolveStudentHomePath(orgId, user.id);

      return c.json({ success: true, data: { path } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to resolve student home');
    }
  });
