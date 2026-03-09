import { ZSsoDiscoveryQuery } from '@cio/utils/validation/organization/sso';
import { discoverSso, getOrgSsoInfo } from '@api/services/auth/sso';

import { Hono } from '@api/utils/hono';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';

export const ssoDiscoveryRouter = new Hono()
  /**
   * GET /sso/discover?email=user@example.com
   * Public endpoint to discover SSO for an email address
   */
  .get('/discover', zValidator('query', ZSsoDiscoveryQuery), async (c) => {
    try {
      const { email } = c.req.valid('query');
      const result = await discoverSso(email);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to discover SSO');
    }
  })

  /**
   * GET /sso/org/:orgId
   * Get SSO info for a specific organization
   * Used when org context is known (e.g., custom domain login)
   */
  .get('/org/:orgId', async (c) => {
    try {
      const orgId = c.req.param('orgId');
      const result = await getOrgSsoInfo(orgId);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to get organization SSO info');
    }
  });
