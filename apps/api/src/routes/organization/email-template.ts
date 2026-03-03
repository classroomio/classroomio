import {
  ZDeleteEmailTemplate,
  ZEmailTemplateLocaleQuery,
  ZGetEmailTemplateParams,
  ZListEmailTemplatesQuery,
  ZPreviewEmailTemplate,
  ZUpsertEmailTemplate
} from '@cio/utils/validation/email-template';
import {
  deleteEmailTemplateService,
  getEmailTemplateService,
  listEmailTemplatesService,
  previewEmailTemplateService,
  upsertEmailTemplateService
} from '@api/services/email-template';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const organizationEmailTemplateRouter = new Hono()
  /**
   * GET /organization/email-templates
   * List organization email templates and template catalog
   */
  .get('/', authMiddleware, orgAdminMiddleware, zValidator('query', ZListEmailTemplatesQuery), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const query = c.req.valid('query');
      const result = await listEmailTemplatesService(orgId, query);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return handleError(c, error, 'Failed to list email templates');
    }
  })

  /**
   * GET /organization/email-templates/:emailId
   * Get template details for specific emailId+locale with fallback metadata
   */
  .get(
    '/:emailId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZGetEmailTemplateParams),
    zValidator('query', ZEmailTemplateLocaleQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { emailId } = c.req.valid('param');
        const { locale } = c.req.valid('query');
        const result = await getEmailTemplateService(orgId, emailId, locale);

        return c.json({
          success: true,
          data: result
        });
      } catch (error) {
        return handleError(c, error, 'Failed to fetch email template');
      }
    }
  )

  /**
   * PUT /organization/email-templates/:emailId
   * Create or update an organization email template override
   */
  .put(
    '/:emailId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZGetEmailTemplateParams),
    zValidator('json', ZUpsertEmailTemplate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { emailId } = c.req.valid('param');
        const body = c.req.valid('json');

        const result = await upsertEmailTemplateService(orgId, emailId, body, user.id);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to save email template');
      }
    }
  )

  /**
   * DELETE /organization/email-templates/:emailId
   * Delete an organization email template override for locale
   */
  .delete(
    '/:emailId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZGetEmailTemplateParams),
    zValidator('query', ZDeleteEmailTemplate),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { emailId } = c.req.valid('param');
        const query = c.req.valid('query');

        const result = await deleteEmailTemplateService(orgId, emailId, query, user.id);

        return c.json({
          success: true,
          data: result
        });
      } catch (error) {
        return handleError(c, error, 'Failed to delete email template');
      }
    }
  )

  /**
   * POST /organization/email-templates/:emailId/preview
   * Render preview HTML using optional logo/content overrides
   */
  .post(
    '/:emailId/preview',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZGetEmailTemplateParams),
    zValidator('json', ZPreviewEmailTemplate),
    async (c) => {
      try {
        const { emailId } = c.req.valid('param');
        const body = c.req.valid('json');
        const result = await previewEmailTemplateService(emailId, body);

        return c.json({
          success: true,
          data: result
        });
      } catch (error) {
        return handleError(c, error, 'Failed to preview email template');
      }
    }
  );
