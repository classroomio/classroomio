import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';
import { handleError } from '@api/utils/errors';
import { ZCreateOrgCertificatePreset, ZUpdateOrgCertificatePreset } from '@cio/utils/validation/plugins';
import {
  listOrgCertificatePresetsService,
  getOrgCertificatePresetService,
  createOrgCertificatePresetService,
  updateOrgCertificatePresetService,
  deleteOrgCertificatePresetService
} from '@api/services/plugin/org-certificate-preset';

export const certificateStudioRouter = new Hono()
  /**
   * GET /plugins/certificate-studio/presets
   * Lists all active custom certificate presets for the organization.
   */
  .get('/presets', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const presets = await listOrgCertificatePresetsService(orgId);

      return c.json({ success: true, data: presets }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch certificate presets');
    }
  })
  /**
   * GET /plugins/certificate-studio/presets/:presetId
   * Fetches a single preset by ID within the organization.
   */
  .get('/presets/:presetId', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const presetId = c.req.param('presetId');
      const preset = await getOrgCertificatePresetService(orgId, presetId);

      return c.json({ success: true, data: preset }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch certificate preset');
    }
  })
  /**
   * POST /plugins/certificate-studio/presets
   * Creates a new custom certificate preset for the organization.
   */
  .post('/presets', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateOrgCertificatePreset), async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const user = c.get('user')!;
      const body = c.req.valid('json');
      const preset = await createOrgCertificatePresetService(orgId, user.id, body);

      return c.json({ success: true, data: preset }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create certificate preset');
    }
  })
  /**
   * PUT /plugins/certificate-studio/presets/:presetId
   * Updates a custom certificate preset.
   */
  .put(
    '/presets/:presetId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZUpdateOrgCertificatePreset),
    async (c) => {
      try {
        const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
        const presetId = c.req.param('presetId');
        const body = c.req.valid('json');
        const updated = await updateOrgCertificatePresetService(orgId, presetId, body);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update certificate preset');
      }
    }
  )
  /**
   * DELETE /plugins/certificate-studio/presets/:presetId
   * Soft-deletes a certificate preset (sets isActive=false).
   */
  .delete('/presets/:presetId', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = (c.get('orgId') as string) || c.req.header('cio-org-id')!;
      const presetId = c.req.param('presetId');
      await deleteOrgCertificatePresetService(orgId, presetId);

      return c.json({ success: true, data: null }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete certificate preset');
    }
  });
