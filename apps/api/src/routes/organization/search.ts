import { ZSearchOrganization } from '@cio/utils/validation/organization';

import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { searchLmsOrganization, searchOrganization } from '@api/services/organization/search';
import { zValidator } from '@hono/zod-validator';

export const searchRouter = new Hono()
  .get('/', authMiddleware, orgTeamMemberMiddleware, zValidator('query', ZSearchOrganization), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
      const includeAudience = orgRoles[orgId] === ROLE.ADMIN;
      const { q, limit } = c.req.valid('query');
      const results = await searchOrganization(orgId, q, limit, includeAudience);

      return c.json({ success: true, data: results });
    } catch (error) {
      return handleError(c, error, 'Failed to search organization');
    }
  })
  .get('/lms', authMiddleware, orgMemberMiddleware, zValidator('query', ZSearchOrganization), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const { q, limit } = c.req.valid('query');
      const results = await searchLmsOrganization(orgId, user.id, q, limit);

      return c.json({ success: true, data: results });
    } catch (error) {
      return handleError(c, error, 'Failed to search LMS');
    }
  });
