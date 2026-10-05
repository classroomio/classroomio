import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import {
  listStudentEmailTemplates,
  resetStudentEmailTemplate,
  saveStudentEmailTemplate,
  sendStudentEmailTemplateTest
} from '@api/services/organization/student-email-templates';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import {
  ZStudentEmailTemplateParams,
  ZTestStudentEmailTemplate,
  ZUpsertStudentEmailTemplate
} from '@cio/utils/validation/organization';
import { zValidator } from '@hono/zod-validator';

const studentEmailTestRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many test emails. Please try again later.',
  keyGenerator: (c) => `student_email_test:${c.req.header('cio-org-id') ?? 'unknown'}`
});

export const studentEmailTemplatesRouter = new Hono()
  .get('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const organizationId = c.req.header('cio-org-id')!;
      const templates = await listStudentEmailTemplates(organizationId);
      return c.json({ success: true, data: templates }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list student email templates');
    }
  })
  .post(
    '/:emailId/:locale/test',
    authMiddleware,
    orgAdminMiddleware,
    studentEmailTestRateLimit,
    zValidator('param', ZStudentEmailTemplateParams),
    zValidator('json', ZTestStudentEmailTemplate),
    async (c) => {
      try {
        const organizationId = c.req.header('cio-org-id')!;
        const { emailId, locale } = c.req.valid('param');
        const { subject, content, recipientEmails } = c.req.valid('json');
        const result = await sendStudentEmailTemplateTest({
          organizationId,
          emailId,
          locale,
          subject,
          content,
          recipientEmails
        });
        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handleError(c, error, 'Failed to send student email test');
      }
    }
  )
  .put(
    '/:emailId/:locale',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZStudentEmailTemplateParams),
    zValidator('json', ZUpsertStudentEmailTemplate),
    async (c) => {
      try {
        const organizationId = c.req.header('cio-org-id')!;
        const { emailId, locale } = c.req.valid('param');
        const { content, subject } = c.req.valid('json');
        const template = await saveStudentEmailTemplate({ organizationId, emailId, locale, content, subject });
        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to save student email template');
      }
    }
  )
  .delete(
    '/:emailId/:locale',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZStudentEmailTemplateParams),
    async (c) => {
      try {
        const organizationId = c.req.header('cio-org-id')!;
        const { emailId, locale } = c.req.valid('param');
        const deleted = await resetStudentEmailTemplate(organizationId, emailId, locale);
        return c.json({ success: true, data: { deleted, isCustomized: false } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reset student email template');
      }
    }
  );
