import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import { ZUpdateOrgCapability } from '@cio/utils/validation/plugins';
import { listOrgCapabilitiesService, setOrgCapabilityService } from '@api/services/plugin/org-capability';

export const capabilitiesRouter = new Hono()
  /**
   * GET /plugins/capabilities
   * Returns list of SaaS capabilities and their org activation status.
   * Public to organization members; returns no secrets or private configs.
   */
  .get('/', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const capabilities = await listOrgCapabilitiesService(orgId);

      return c.json({ success: true, data: capabilities }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch capabilities');
    }
  })
  /**
   * PUT /plugins/capabilities/:capabilityId
   * Admin-only: Toggles a capability on/off for an organization.
   */
  .put('/:capabilityId', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateOrgCapability), async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const capabilityId = c.req.param('capabilityId');
      const body = c.req.valid('json');

      const updated = await setOrgCapabilityService(orgId, capabilityId, body.isEnabled);

      return c.json({ success: true, data: updated }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to update capability');
    }
  });
