import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn(),
  release: vi.fn(),
  rateLimitKeys: [] as Array<{ key: string; failClosed?: boolean }>,
  emailTemplates: {
    listEmailTemplatesService: vi.fn(),
    getEmailTemplateService: vi.fn(),
    saveEmailTemplateService: vi.fn(),
    resetEmailTemplateService: vi.fn(),
    sendTestEmailTemplateService: vi.fn()
  }
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter:
    (options: { keyGenerator?: (c: Context) => string; failClosed?: boolean } = {}) =>
    async (c: Context, next: Next) => {
      const key = options.keyGenerator?.(c);
      if (key?.startsWith('student_email_test:')) mocks.rateLimitKeys.push({ key, failClosed: options.failClosed });
      return next();
    }
}));

vi.mock('@api/services/organization/automation-key', () => ({
  authenticateOrganizationApiKeyService: mocks.authenticate,
  organizationApiKeyHasScopes: (keyScopes: string[], requiredScopes: string[]) =>
    requiredScopes.every((scope) => keyScopes.includes(scope)),
  touchOrganizationApiKeyLastUsedService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn().mockResolvedValue('reservation-id'),
  completeMcpAutomationUsage: mocks.complete,
  releaseMcpAutomationUsage: mocks.release
}));

vi.mock('@api/services/v1/organization/email-templates', () => mocks.emailTemplates);

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1Router } from '@api/routes/v1';

const SCOPES = ['organization:read', 'organization:write'];
const TEMPLATE_PATH = '/organization/email-templates/studentCourseWelcome/fr';

const summary = {
  emailId: 'studentCourseWelcome',
  locale: 'fr',
  subject: 'Bienvenue',
  isCustomized: true,
  updatedAt: '2026-10-25T10:00:00.000Z'
};
const template = { ...summary, content: '<p>Salut</p>', variables: ['org_name', 'course_name'], hasActionLink: true };
const pagination = { page: 1, limit: 20, total: 12, totalPages: 1 };

const app = new Hono().route('/public-api/v1', v1Router);

const request = (method: string, path: string, body?: unknown) =>
  app.request(`/public-api/v1${path}`, {
    method,
    headers: { Authorization: 'Bearer cio_mcp_test', 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

const useKey = (type: 'mcp' | 'api', scopes: string[]) =>
  mocks.authenticate.mockResolvedValue({
    id: 'key-id',
    organizationId: 'org-id',
    createdByProfileId: 'actor-id',
    type,
    scopes
  });

const routes: Array<[string, string, unknown, string, number, number]> = [
  ['GET', '/organization/email-templates', undefined, 'list_email_templates', 0, 200],
  ['GET', TEMPLATE_PATH, undefined, 'get_email_template', 0, 200],
  ['PUT', TEMPLATE_PATH, { content: '<p>Salut</p>' }, 'update_email_template', 1, 200],
  ['DELETE', TEMPLATE_PATH, undefined, 'reset_email_template', 1, 200],
  ['POST', `${TEMPLATE_PATH}/test`, { recipientEmails: ['a@example.com'] }, 'send_test_email_template', 1, 202]
];

describe('organization email template routes through the v1 router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimitKeys.length = 0;
    mocks.complete.mockResolvedValue(undefined);
    mocks.release.mockResolvedValue(undefined);
    mocks.emailTemplates.listEmailTemplatesService.mockResolvedValue({ items: [summary], pagination });
    mocks.emailTemplates.getEmailTemplateService.mockResolvedValue(template);
    mocks.emailTemplates.saveEmailTemplateService.mockResolvedValue(template);
    mocks.emailTemplates.resetEmailTemplateService.mockResolvedValue({ ...template, isCustomized: false });
    mocks.emailTemplates.sendTestEmailTemplateService.mockResolvedValue({ queued: true });
    useKey('mcp', SCOPES);
  });

  it.each(routes)(
    '%s %s is mounted, reachable by an MCP key, and metered as %s',
    async (method, path, body, tool, credits, status) => {
      const response = await request(method, path, body);

      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ success: true });
      expect(mocks.complete).toHaveBeenCalledWith('reservation-id', tool, credits);
    }
  );

  it.each(routes)('%s %s is closed to an MCP key without the organization scopes', async (method, path, body) => {
    useKey('mcp', ['team:read', 'team:write', 'audience:read', 'audience:write']);

    expect((await request(method, path, body)).status).toBe(403);
    for (const service of Object.values(mocks.emailTemplates)) {
      expect(service).not.toHaveBeenCalled();
    }
  });

  it.each(routes)(
    '%s %s is open to an API key with public_api:*',
    async (method, path, body, _tool, _credits, status) => {
      useKey('api', ['public_api:*']);

      expect((await request(method, path, body)).status).toBe(status);
    }
  );

  it('keeps organization:read from writing', async () => {
    useKey('mcp', ['organization:read']);

    expect((await request('GET', TEMPLATE_PATH)).status).toBe(200);
    expect((await request('PUT', TEMPLATE_PATH, { content: '<p>x</p>' })).status).toBe(403);
    expect((await request('DELETE', TEMPLATE_PATH)).status).toBe(403);
    expect((await request('POST', `${TEMPLATE_PATH}/test`, { recipientEmails: ['a@example.com'] })).status).toBe(403);
    expect(mocks.emailTemplates.saveEmailTemplateService).not.toHaveBeenCalled();
    expect(mocks.emailTemplates.resetEmailTemplateService).not.toHaveBeenCalled();
    expect(mocks.emailTemplates.sendTestEmailTemplateService).not.toHaveBeenCalled();
  });

  it('passes the key organization and creator to every service', async () => {
    const params = { emailId: 'studentCourseWelcome', locale: 'fr' };

    await request('GET', '/organization/email-templates?locale=fr&limit=5');
    expect(mocks.emailTemplates.listEmailTemplatesService).toHaveBeenCalledWith('org-id', 'actor-id', {
      page: 1,
      limit: 5,
      locale: 'fr'
    });

    await request('GET', TEMPLATE_PATH);
    expect(mocks.emailTemplates.getEmailTemplateService).toHaveBeenCalledWith('org-id', 'actor-id', params);

    await request('PUT', TEMPLATE_PATH, { content: '<p>Salut</p>', subject: null });
    expect(mocks.emailTemplates.saveEmailTemplateService).toHaveBeenCalledWith('org-id', 'actor-id', params, {
      content: '<p>Salut</p>',
      subject: null
    });

    await request('DELETE', TEMPLATE_PATH);
    expect(mocks.emailTemplates.resetEmailTemplateService).toHaveBeenCalledWith('org-id', 'actor-id', params);

    await request('POST', `${TEMPLATE_PATH}/test`, { recipientEmails: [' a@example.com '] });
    expect(mocks.emailTemplates.sendTestEmailTemplateService).toHaveBeenCalledWith('org-id', 'actor-id', params, {
      recipientEmails: ['a@example.com']
    });
  });

  it('lists English templates when no locale is given', async () => {
    await request('GET', '/organization/email-templates');

    expect(mocks.emailTemplates.listEmailTemplatesService).toHaveBeenCalledWith('org-id', 'actor-id', {
      page: 1,
      limit: 20,
      locale: 'en'
    });
  });

  it('returns the list envelope with pagination and no-store caching', async () => {
    const response = await request('GET', '/organization/email-templates');

    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: [summary], pagination });
    expect((await request('GET', TEMPLATE_PATH)).headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('rate-limits test sends per organization, on the same key as the dashboard, failing closed', async () => {
    await request('POST', `${TEMPLATE_PATH}/test`, { recipientEmails: ['a@example.com'] });

    expect(mocks.rateLimitKeys).toEqual([{ key: 'student_email_test:org-id', failClosed: true }]);
  });

  it.each([
    ['GET', '/organization/email-templates?locale=xx', undefined],
    ['GET', '/organization/email-templates?limit=101', undefined],
    ['GET', '/organization/email-templates/unknownEmail/fr', undefined],
    ['GET', '/organization/email-templates/studentCourseWelcome/xx', undefined],
    ['PUT', TEMPLATE_PATH, {}],
    ['PUT', TEMPLATE_PATH, { content: '' }],
    ['PUT', TEMPLATE_PATH, { content: '<p>x</p>', subject: '' }],
    ['PUT', TEMPLATE_PATH, { content: 'x'.repeat(50_001) }],
    ['POST', `${TEMPLATE_PATH}/test`, {}],
    ['POST', `${TEMPLATE_PATH}/test`, { recipientEmails: [] }],
    ['POST', `${TEMPLATE_PATH}/test`, { recipientEmails: ['not-an-email'] }],
    ['POST', `${TEMPLATE_PATH}/test`, { recipientEmails: Array.from({ length: 6 }, (_, i) => `a${i}@example.com`) }]
  ])('%s %s with %j is a 400 that is not metered', async (method, path, body) => {
    const response = await request(method, path, body);

    expect(response.status).toBe(400);
    for (const service of Object.values(mocks.emailTemplates)) {
      expect(service).not.toHaveBeenCalled();
    }
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledWith('reservation-id');
  });

  it('returns 403 UPGRADE_REQUIRED from the plan gate', async () => {
    mocks.emailTemplates.saveEmailTemplateService.mockRejectedValue(
      new AppError('Student email customization requires a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await request('PUT', TEMPLATE_PATH, { content: '<p>x</p>' });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.UPGRADE_REQUIRED });
  });

  it('returns 400 for a placeholder the email does not allow', async () => {
    mocks.emailTemplates.saveEmailTemplateService.mockRejectedValue(
      new AppError('Unknown template placeholders: {{nope}}', ErrorCodes.VALIDATION_ERROR, 400)
    );

    const response = await request('PUT', TEMPLATE_PATH, { content: '<p>{{nope}}</p>' });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.VALIDATION_ERROR });
  });

  it('returns 403 when the key creator is not an org admin', async () => {
    mocks.emailTemplates.listEmailTemplatesService.mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    expect((await request('GET', '/organization/email-templates')).status).toBe(403);
  });

  it('documents every route under the Organization Email Templates tag', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<
        string,
        Record<
          string,
          {
            summary?: string;
            tags?: string[];
            responses: Record<string, unknown>;
            parameters?: Array<{ name: string }>;
            requestBody?: unknown;
          }
        >
      >;
    };

    const list = spec.paths['/public-api/v1/organization/email-templates'];
    const one = spec.paths['/public-api/v1/organization/email-templates/{emailId}/{locale}'];
    const test = spec.paths['/public-api/v1/organization/email-templates/{emailId}/{locale}/test'];
    const tags = ['Organization Email Templates'];

    expect(list.get).toMatchObject({ summary: 'List student email templates', tags });
    expect(one.get).toMatchObject({ summary: 'Get a student email template', tags });
    expect(one.put).toMatchObject({ summary: 'Save a student email template', tags });
    expect(one.delete).toMatchObject({ summary: 'Reset a student email template', tags });
    expect(test.post).toMatchObject({ summary: 'Send a test student email', tags });
    expect(Object.keys(one.put.responses).sort()).toEqual(['200', '400', '401', '403', '429']);
    expect(Object.keys(test.post.responses).sort()).toEqual(['202', '400', '401', '403', '429', '503']);
    expect(test.post.parameters?.map((parameter) => parameter.name).sort()).toEqual(['emailId', 'locale']);
    expect(test.post.requestBody).toBeDefined();
    expect(list.get.parameters?.map((parameter) => parameter.name).sort()).toEqual(['limit', 'locale', 'page']);
  });
});
