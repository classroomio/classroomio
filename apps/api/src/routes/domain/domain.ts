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
        case 'connect': {
          const connected = await connectOrgDomain(orgId, domain);

          return c.json({ success: true, data: connected }, 200);
        }
        case 'refresh': {
          const refreshed = await refreshOrgDomain(orgId);

          return c.json({ success: true, data: refreshed }, 200);
        }
        case 'remove': {
          const removed = await removeOrgDomain(orgId);

          return c.json({ success: true, data: removed }, 200);
        }
      }
    } catch (error) {
      return handleError(c, error, 'Failed to process domain request');
    }
  });
