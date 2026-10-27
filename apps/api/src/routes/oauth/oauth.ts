import { ZSelectOAuthOrganization } from '@cio/utils/validation/organization';
import { zValidator } from '@hono/zod-validator';

import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { MCP_RESOURCE } from '@cio/db/auth';
import {
  getSelectedOAuthOrganizationService,
  listOAuthOrganizationsService,
  selectOAuthOrganizationService
} from '@api/services/oauth/oauth';

export const oauthRouter = new Hono()
  .get('/config', authMiddleware, (c) => c.json({ success: true, data: { mcpUrl: MCP_RESOURCE } }, 200))
  .get('/organizations', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const organizations = await listOAuthOrganizationsService(user.id);

      return c.json({ success: true, data: organizations }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list organizations');
    }
  })
  .get('/organization-selection', authMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const session = c.get('session')!;
      const organization = await getSelectedOAuthOrganizationService(session.id, user.id);

      return c.json({ success: true, data: organization }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to read organization selection');
    }
  })
  .post('/organization-selection', authMiddleware, zValidator('json', ZSelectOAuthOrganization), async (c) => {
    try {
      const user = c.get('user')!;
      const session = c.get('session')!;
      const { organizationId } = c.req.valid('json');
      await selectOAuthOrganizationService(session.id, user.id, organizationId);

      return c.json({ success: true, data: { organizationId } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to select organization');
    }
  });
