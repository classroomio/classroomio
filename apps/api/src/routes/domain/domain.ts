import { ZDomainActionRequest } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { connectOrgDomain, refreshOrgDomain, removeOrgDomain } from '@api/services/org/domain';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const domainRouter = new Hono()
  /**
   * POST /domain
   * Handles domain operations: connect, refresh, or remove
   * Refresh and remove act on the org's stored domain, not the one in the body
   * Requires authentication and organization admin access
   */
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZDomainActionRequest), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { action, domain } = c.req.valid('json');

      switch (action) {
        case 'connect':
          return c.json({ success: true, data: await connectOrgDomain(orgId, domain) }, 200);
        case 'refresh':
          return c.json({ success: true, data: await refreshOrgDomain(orgId) }, 200);
        case 'remove':
          return c.json({ success: true, data: await removeOrgDomain(orgId) }, 200);
      }
    } catch (error) {
      return handleError(c, error, 'Failed to process domain request');
    }
  });
