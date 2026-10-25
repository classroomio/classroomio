import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  complete: vi.fn(),
  release: vi.fn(),
  templates: {
    listCourseTemplatesService: vi.fn(),
    getCourseTemplateService: vi.fn(),
    createCourseFromTemplateService: vi.fn(),
    saveCourseAsTemplateService: vi.fn()
  }
}));

vi.mock('@hono/node-server/conninfo', () => ({
  getConnInfo: () => ({ remote: { address: '127.0.0.1' } })
}));

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
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

vi.mock('@api/services/v1/courses/templates', () => mocks.templates);

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { v1Router } from '@api/routes/v1';

const TEMPLATE_ID = '33333333-3333-4333-8333-333333333333';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
const card = { id: TEMPLATE_ID, title: 'Onboarding', source: 'org' };

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
  ['GET', '/course-templates', undefined, 'list_course_templates', 0, 200],
  ['GET', `/course-templates/${TEMPLATE_ID}`, undefined, 'get_course_template', 0, 200],
  [
    'POST',
    `/course-templates/${TEMPLATE_ID}/courses`,
    { title: 'Q3 onboarding' },
    'create_course_from_template',
    1,
    201
  ],
  ['POST', `/courses/${COURSE_ID}/template`, { title: 'Onboarding template' }, 'save_course_as_template', 1, 201]
];

describe('course template routes through the v1 router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.complete.mockResolvedValue(undefined);
    mocks.release.mockResolvedValue(undefined);
    mocks.templates.listCourseTemplatesService.mockResolvedValue({ items: [card], pagination });
    mocks.templates.getCourseTemplateService.mockResolvedValue(card);
    mocks.templates.createCourseFromTemplateService.mockResolvedValue({ id: COURSE_ID });
    mocks.templates.saveCourseAsTemplateService.mockResolvedValue({ id: TEMPLATE_ID });
    useKey('mcp', ['course:read', 'course:write']);
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

  it.each(routes)('%s %s is closed to an MCP key without the course scopes', async (method, path, body) => {
    useKey('mcp', ['course:exercise:read', 'course:exercise:write', 'cohort:read', 'cohort:write']);

    expect((await request(method, path, body)).status).toBe(403);
    for (const service of Object.values(mocks.templates)) {
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

  it('keeps course:read from writing', async () => {
    useKey('mcp', ['course:read']);

    expect((await request('GET', '/course-templates')).status).toBe(200);
    expect((await request('POST', `/course-templates/${TEMPLATE_ID}/courses`, { title: 'New' })).status).toBe(403);
    expect((await request('POST', `/courses/${COURSE_ID}/template`, { title: 'New' })).status).toBe(403);
    expect(mocks.templates.createCourseFromTemplateService).not.toHaveBeenCalled();
    expect(mocks.templates.saveCourseAsTemplateService).not.toHaveBeenCalled();
  });

  it('passes the key organization, creator and parsed input to the services', async () => {
    await request('GET', '/course-templates?source=global&page=2&limit=5');
    expect(mocks.templates.listCourseTemplatesService).toHaveBeenCalledWith('org-id', 'actor-id', {
      source: 'global',
      page: 2,
      limit: 5
    });

    await request('GET', `/course-templates/${TEMPLATE_ID}`);
    expect(mocks.templates.getCourseTemplateService).toHaveBeenCalledWith('org-id', 'actor-id', {
      templateId: TEMPLATE_ID
    });

    await request('POST', `/course-templates/${TEMPLATE_ID}/courses`, { title: '  Q3 onboarding  ' });
    expect(mocks.templates.createCourseFromTemplateService).toHaveBeenCalledWith(
      'org-id',
      'actor-id',
      { templateId: TEMPLATE_ID },
      { title: 'Q3 onboarding' }
    );

    await request('POST', `/courses/${COURSE_ID}/template`, { title: 'Onboarding template' });
    expect(mocks.templates.saveCourseAsTemplateService).toHaveBeenCalledWith(
      'org-id',
      'actor-id',
      { courseId: COURSE_ID },
      { title: 'Onboarding template' }
    );
  });

  it('defaults the list to every source', async () => {
    await request('GET', '/course-templates');

    expect(mocks.templates.listCourseTemplatesService).toHaveBeenCalledWith('org-id', 'actor-id', {
      source: 'all',
      page: 1,
      limit: 20
    });
  });

  it('returns the list envelope with pagination', async () => {
    const response = await request('GET', '/course-templates');

    expect(await response.json()).toEqual({ success: true, data: [card], pagination });
  });

  it.each([
    ['GET', '/course-templates?source=mine', undefined],
    ['GET', '/course-templates?limit=101', undefined],
    ['GET', '/course-templates/not-a-uuid', undefined],
    ['POST', '/course-templates/not-a-uuid/courses', { title: 'New' }],
    ['POST', `/course-templates/${TEMPLATE_ID}/courses`, {}],
    ['POST', `/course-templates/${TEMPLATE_ID}/courses`, { title: '   ' }],
    ['POST', '/courses/not-a-uuid/template', { title: 'New' }],
    ['POST', `/courses/${COURSE_ID}/template`, {}]
  ])('%s %s with %j is a 400 that is not metered', async (method, path, body) => {
    const response = await request(method, path, body);

    expect(response.status).toBe(400);
    for (const service of Object.values(mocks.templates)) {
      expect(service).not.toHaveBeenCalled();
    }
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledWith('reservation-id');
  });

  it('returns 403 when the key creator is not an org admin', async () => {
    mocks.templates.createCourseFromTemplateService.mockRejectedValue(
      new AppError('Automation actor must be an organization admin', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    const response = await request('POST', `/course-templates/${TEMPLATE_ID}/courses`, { title: 'New' });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED });
  });

  it('returns 403 UPGRADE_REQUIRED when the plan has no template left', async () => {
    mocks.templates.saveCourseAsTemplateService.mockRejectedValue(
      new AppError('Your plan includes 1 template', ErrorCodes.UPGRADE_REQUIRED, 403)
    );

    const response = await request('POST', `/courses/${COURSE_ID}/template`, { title: 'New' });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ success: false, code: ErrorCodes.UPGRADE_REQUIRED });
  });

  it('returns 404 for a template the organization cannot use', async () => {
    mocks.templates.getCourseTemplateService.mockRejectedValue(
      new AppError('Template not found', ErrorCodes.COURSE_NOT_FOUND, 404)
    );

    expect((await request('GET', `/course-templates/${TEMPLATE_ID}`)).status).toBe(404);
  });

  it('documents every template route under the Course Templates tag', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[]; responses: Record<string, unknown> }>>;
    };

    const list = spec.paths['/public-api/v1/course-templates'];
    const detail = spec.paths['/public-api/v1/course-templates/{templateId}'];
    const create = spec.paths['/public-api/v1/course-templates/{templateId}/courses'];
    const save = spec.paths['/public-api/v1/courses/{courseId}/template'];

    expect(list.get).toMatchObject({ summary: 'List course templates', tags: ['Course Templates'] });
    expect(detail.get).toMatchObject({ summary: 'Get a course template', tags: ['Course Templates'] });
    expect(create.post).toMatchObject({ summary: 'Create a course from a template', tags: ['Course Templates'] });
    expect(save.post).toMatchObject({ summary: 'Save a course as a template', tags: ['Course Templates'] });
    expect(Object.keys(create.post.responses).sort()).toEqual(['201', '400', '401', '403', '404', '429']);
    expect(Object.keys(save.post.responses).sort()).toEqual(['201', '400', '401', '403', '404', '429']);
  });
});
