import { ZStudentHomeCourseOptionsQuery, ZStudentHomeResolveHeaders } from '@cio/utils/validation/organization';
import { listStudentHomeOptions, resolveStudentHomePath } from '@api/services/organization/student-home';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
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
        const result = await listStudentHomeOptions(orgId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list student home courses');
      }
    }
  )
  .get('/resolve', authMiddleware, zValidator('header', ZStudentHomeResolveHeaders), async (c) => {
    try {
      const orgId = c.req.valid('header')['cio-org-id'];
      const user = c.get('user')!;
      const path = await resolveStudentHomePath(orgId, user.id);

      return c.json({ success: true, data: { path } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to resolve student home');
    }
  });
