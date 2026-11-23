import {
  getOrganizationHealth,
  getOrganizationStudentCapacity,
  listOrganizationPeopleService
} from '@api/services/organization/insights';

import { Hono } from '@api/utils/hono';
import { ZOrgPeopleQuery } from '@cio/utils/validation/organization';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { zValidator } from '@hono/zod-validator';

export const organizationInsightsRouter = new Hono()
  /**
   * GET /organization/insights/health
   * Organization health for the admin home: active learners, completion rate, recent activity and draft courses.
   */
  .get('/health', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = await getOrganizationHealth(orgId, user.id);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load organization health');
    }
  })
  /**
   * GET /organization/insights/people
   * Everyone in the organization, filtered by role (students, tutors, admins) and search, newest first.
   */
  .get('/people', authMiddleware, orgAdminMiddleware, zValidator('query', ZOrgPeopleQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await listOrganizationPeopleService(orgId, c.req.valid('query'));

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load organization people');
    }
  })
  /**
   * GET /organization/insights/student-capacity
   * Active students against the plan's student limit, for turning off invites before they fail.
   */
  .get('/student-capacity', authMiddleware, orgTeamMemberMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await getOrganizationStudentCapacity(orgId);

      c.header('Cache-Control', 'no-store');

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load student capacity');
    }
  });
