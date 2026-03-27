import { ZDomainActionRequest } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import {
  assertSupportedCustomDomain,
  connectDomain,
  normalizeCustomDomain,
  refreshDomain,
  removeDomain
} from '@api/services/org/domain';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { updateOrg } from '@api/services/organization';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const domainRouter = new Hono()
  /**
   * POST /domain
   * Handles domain operations: connect, refresh, or remove
   * Requires authentication and organization admin access
   */
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZDomainActionRequest), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { action, domain } = c.req.valid('json');

      const normalizedDomain = normalizeCustomDomain(domain);
      assertSupportedCustomDomain(normalizedDomain);

      switch (action) {
        case 'connect': {
          const result = await connectDomain(normalizedDomain);
          await updateOrg(orgId, {
            customDomain: normalizedDomain,
            isCustomDomainVerified: result.verified
          });

          return c.json({ success: true, data: result }, 200);
        }
        case 'refresh': {
          const result = await refreshDomain(normalizedDomain);
          await updateOrg(orgId, {
            customDomain: normalizedDomain,
            isCustomDomainVerified: result.verified
          });

          return c.json({ success: true, data: result }, 200);
        }
        case 'remove': {
          const result = await removeDomain(normalizedDomain);
          await updateOrg(orgId, {
            customDomain: null,
            isCustomDomainVerified: false
          });

          return c.json({ success: true, data: result }, 200);
        }
      }
    } catch (error) {
      return handleError(c, error, 'Failed to process domain request');
    }
  });
