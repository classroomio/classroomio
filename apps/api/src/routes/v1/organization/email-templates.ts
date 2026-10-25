import {
  ZPublicApiEmailTemplateParam,
  ZPublicApiEmailTemplateQuery,
  ZPublicApiEmailTemplateResponse,
  ZPublicApiEmailTemplateSummaryResponse,
  ZPublicApiEmailTemplateTestResponse,
  ZPublicApiSaveEmailTemplate,
  ZPublicApiSendTestEmailTemplate
} from '@cio/utils/validation/public-api';
import {
  getEmailTemplateService,
  listEmailTemplatesService,
  resetEmailTemplateService,
  saveEmailTemplateService,
  sendTestEmailTemplateService
} from '@api/services/v1/organization/email-templates';

import { Hono } from '@api/utils/hono';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import {
  DELIVERY_NOTE,
  EMAIL_TEMPLATES_CACHE_CONTROL,
  EMAIL_TEMPLATES_TAG,
  ORG_ADMIN_RULE,
  organizationForbiddenResponse,
  organizationPlanForbiddenResponse
} from './docs';

const EmailTemplateResponse = itemResponse(ZPublicApiEmailTemplateResponse);

// Same key as the dashboard's limiter, so the dashboard and the API share one budget per organization.
const testEmailRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many test emails. Please try again later.',
  keyGenerator: (c) => `student_email_test:${c.get('orgId') ?? 'unknown'}`,
  failClosed: true
});

export const v1EmailTemplatesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the student emails your organization can customize in one language, without their bodies; ${ORG_ADMIN_RULE}.`,
      tags: [EMAIL_TEMPLATES_TAG],
      responses: {
        200: jsonResponse(
          'Every student email in the requested language, saved or default; get one template for its body',
          paginatedResponse(ZPublicApiEmailTemplateSummaryResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:read'),
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiEmailTemplateQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listEmailTemplatesService(orgId, actorId, query);

        c.header('Cache-Control', EMAIL_TEMPLATES_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list email templates');
      }
    }
  )
  .get(
    '/:emailId/:locale',
    describeRoute({
      description: `Get a student email template with its body and allowed placeholders; ${ORG_ADMIN_RULE}.`,
      tags: [EMAIL_TEMPLATES_TAG],
      responses: {
        200: jsonResponse('The saved template, or the default when none is saved', EmailTemplateResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: organizationForbiddenResponse('organization:read'),
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiEmailTemplateParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const template = await getEmailTemplateService(orgId, actorId, params);

        c.header('Cache-Control', EMAIL_TEMPLATES_CACHE_CONTROL);
        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch email template');
      }
    }
  )
  .put(
    '/:emailId/:locale',
    describeRoute({
      description: `Save the body and, optionally, the subject of a student email in one language; ${ORG_ADMIN_RULE}.`,
      tags: [EMAIL_TEMPLATES_TAG],
      responses: {
        200: jsonResponse(`Template saved, with unsafe HTML removed; ${DELIVERY_NOTE}`, EmailTemplateResponse),
        400: {
          description:
            'Invalid path or body, a placeholder this email does not allow, or an action link on an email that has none'
        },
        401: errorResponses.unauthorized,
        403: organizationPlanForbiddenResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiEmailTemplateParam),
    validator('json', ZPublicApiSaveEmailTemplate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const template = await saveEmailTemplateService(orgId, actorId, params, payload);

        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to save email template');
      }
    }
  )
  .delete(
    '/:emailId/:locale',
    describeRoute({
      description: `Reset a student email in one language to the default; ${ORG_ADMIN_RULE}.`,
      tags: [EMAIL_TEMPLATES_TAG],
      responses: {
        200: jsonResponse(
          'The default template; also returned when the template was never customized',
          EmailTemplateResponse
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: organizationPlanForbiddenResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiEmailTemplateParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const template = await resetEmailTemplateService(orgId, actorId, params);

        return c.json({ success: true, data: template }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reset email template');
      }
    }
  )
  .post(
    '/:emailId/:locale/test',
    describeRoute({
      description: `Send a test of a student email, filled with sample values, to up to 5 addresses; ${ORG_ADMIN_RULE}.`,
      tags: [EMAIL_TEMPLATES_TAG],
      responses: {
        202: jsonResponse('Test email queued', itemResponse(ZPublicApiEmailTemplateTestResponse)),
        400: {
          description:
            'Invalid path or body, a placeholder this email does not allow, or an action link on an email that has none'
        },
        401: errorResponses.unauthorized,
        403: organizationPlanForbiddenResponse,
        429: {
          description: `More than 5 test emails in 15 minutes for the organization (shared with the dashboard), or: ${mcpRateLimitResponse.description}`
        },
        503: {
          description:
            'The email could not be queued, or the test-email limit could not be checked (code RATE_LIMIT_UNAVAILABLE)'
        }
      }
    }),
    testEmailRateLimit,
    validator('param', ZPublicApiEmailTemplateParam),
    validator('json', ZPublicApiSendTestEmailTemplate),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await sendTestEmailTemplateService(orgId, actorId, params, payload);

        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to send test email');
      }
    }
  );
