import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

const mocks = vi.hoisted(() => ({ authenticate: vi.fn() }));

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

vi.mock('@api/routes/v1/audience', () => ({ v1AudienceRouter: new Hono().get('/', (c) => c.json({ success: true })) }));
vi.mock('@api/routes/v1/courses/course', () => ({
  v1CourseRouter: new Hono().get('/', (c) => c.json({ success: true }))
}));

vi.mock('@api/services/v1/courses/certificates', () => ({
  downloadPublicApiCourseCertificateService: vi.fn(),
  getPublicApiCourseCertificateService: vi.fn(),
  listPublicApiCourseCertificatesService: vi.fn(),
  updatePublicApiCourseCertificateService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  completeMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import {
  downloadPublicApiCourseCertificateService,
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/courses/certificates';
import {
  completeMcpAutomationUsage,
  releaseMcpAutomationUsage,
  reserveMcpAutomationUsage
} from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const CERTIFICATE_SCOPES = ['course:certificate:read', 'course:certificate:write'];

const app = new Hono().route('/public-api/v1', v1Router);

const requestAs = (type: 'mcp' | 'api', scopes: string[], path: string, init: RequestInit = {}) => {
  mocks.authenticate.mockResolvedValue({
    id: `${type}-key`,
    organizationId: 'org-1',
    createdByProfileId: 'actor-1',
    type,
    scopes
  });

  return app.request(`/public-api/v1${path}`, {
    ...init,
    headers: { Authorization: 'Bearer key', 'content-type': 'application/json', ...init.headers }
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  vi.mocked(completeMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(releaseMcpAutomationUsage).mockResolvedValue(undefined);
  vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({} as never);
  vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({} as never);
  vi.mocked(listPublicApiCourseCertificatesService).mockResolvedValue({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  });
  vi.mocked(downloadPublicApiCourseCertificateService).mockResolvedValue({
    file: new Uint8Array([1]),
    format: 'pdf',
    courseName: 'Intro'
  } as never);
});

describe('MCP metering on certificate routes through the real v1 router', () => {
  it.each([
    ['get_course_certificate', 0, `/courses/${COURSE_ID}/certificate`, {}],
    [
      'update_course_certificate',
      1,
      `/courses/${COURSE_ID}/certificate`,
      { method: 'PATCH', body: JSON.stringify({ isDownloadable: true }) }
    ],
    ['list_course_certificates', 0, `/courses/${COURSE_ID}/certificates`, {}],
    ['download_course_certificate', 0, `/courses/${COURSE_ID}/certificates/${MEMBER_ID}/download`, {}]
  ])('meters %s at %i credits', async (toolName, credits, path, init) => {
    const response = await requestAs('mcp', CERTIFICATE_SCOPES, path, init);

    expect(response.status).toBe(200);
    expect(reserveMcpAutomationUsage).toHaveBeenCalledTimes(1);
    expect(completeMcpAutomationUsage).toHaveBeenCalledWith('usage-1', toolName, credits);
  });

  it('passes the key creator as the actor and the key org as the org', async () => {
    await requestAs('mcp', CERTIFICATE_SCOPES, `/courses/${COURSE_ID}/certificate`);

    expect(getPublicApiCourseCertificateService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID });
  });
});

describe('certificate route scopes', () => {
  it.each([`/courses/${COURSE_ID}/certificate`, `/courses/${COURSE_ID}/certificates`])(
    'lets a key with only certificate scopes reach %s',
    async (path) => {
      const response = await requestAs('mcp', CERTIFICATE_SCOPES, path);

      expect(response.status).toBe(200);
    }
  );

  it.each(['/courses', `/courses/${COURSE_ID}/members`, '/audience'])(
    'keeps a certificate-only key out of %s',
    async (path) => {
      const response = await requestAs('mcp', CERTIFICATE_SCOPES, path);

      expect(response.status).toBe(403);
      expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
    }
  );

  it('lets a public_api:* key reach both certificate and other routes', async () => {
    const certificate = await requestAs('api', ['public_api:*'], `/courses/${COURSE_ID}/certificate`);
    const courses = await requestAs('api', ['public_api:*'], '/courses');

    expect(certificate.status).toBe(200);
    expect(courses.status).toBe(200);
  });
});
