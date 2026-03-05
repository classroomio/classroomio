import { ZCreateSsoConnection, ZUpdateSsoConnection, ZUpdateSsoPolicy } from '@cio/utils/validation/organization/sso';
import {
  activateSsoConnection,
  createSsoConnection,
  deleteSsoConnection,
  getSsoConnection,
  updateSsoConnection,
  updateSsoPolicy
} from '@api/services/organization/sso';

import { Hono } from '@api/utils/hono';
import { auth } from '@cio/db/auth';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const organizationSsoRouter = new Hono()
  /**
   * GET /organization/sso
   * Get SSO connection and policy for current org
   * Requires: Admin role
   */
  .get('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const result = await getSsoConnection(orgId);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch SSO configuration');
    }
  })

  /**
   * POST /organization/sso
   * Create new SSO connection
   * Requires: Admin role
   */
  .post('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateSsoConnection), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');

      const result = await createSsoConnection(
        orgId,
        data,
        user.id,
        auth.api as unknown as { registerSSOProvider: (args: unknown) => Promise<unknown> },
        c.req.raw.headers
      );

      return c.json(
        {
          success: true,
          data: result
        },
        201
      );
    } catch (error) {
      return handleError(c, error, 'Failed to create SSO connection');
    }
  })

  /**
   * PUT /organization/sso
   * Update SSO connection metadata
   * Requires: Admin role
   */
  .put('/', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateSsoConnection), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const data = c.req.valid('json');

      const result = await updateSsoConnection(orgId, data, user.id);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to update SSO connection');
    }
  })

  /**
   * DELETE /organization/sso
   * Delete SSO connection
   * Requires: Admin role
   */
  .delete('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;

      await deleteSsoConnection(
        orgId,
        auth.api as unknown as { deleteSSOProvider: (args: unknown) => Promise<unknown> }
      );

      return c.json({
        success: true
      });
    } catch (error) {
      return handleError(c, error, 'Failed to delete SSO connection');
    }
  })

  /**
   * POST /organization/sso/activate
   * Activate SSO connection
   * Requires: Admin role
   */
  .post('/activate', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const user = c.get('user')!;

      const result = await activateSsoConnection(orgId, user.id);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to activate SSO connection');
    }
  })

  /**
   * GET /organization/sso/policy
   * Get SSO policy for current org
   * Requires: Admin role
   */
  .get('/policy', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const result = await getSsoConnection(orgId);

      return c.json({
        success: true,
        data: result?.policy ?? null
      });
    } catch (error) {
      return handleError(c, error, 'Failed to fetch SSO policy');
    }
  })

  /**
   * PUT /organization/sso/policy
   * Update SSO policy
   * Requires: Admin role
   */
  .put('/policy', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateSsoPolicy), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');

      const result = await updateSsoPolicy(orgId, data);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to update SSO policy');
    }
  });
