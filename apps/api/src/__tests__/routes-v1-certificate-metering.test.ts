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

vi.mock('@api/services/organization/automation-key', async (importOriginal) => {
  const original = await importOriginal<typeof import('@api/services/organization/automation-key')>();

  return {
    authenticateOrganizationApiKeyService: mocks.authenticate,
    organizationApiKeyHasScopes: original.organizationApiKeyHasScopes,
    organizationApiKeyHasAnyScope: original.organizationApiKeyHasAnyScope,
    touchOrganizationApiKeyLastUsedService: vi.fn()
  };
});

vi.mock('@api/routes/v1/audience', () => ({ v1AudienceRouter: new Hono() }));
vi.mock('@api/routes/v1/courses', () => ({ v1CoursesRouter: new Hono() }));

vi.mock('@api/services/v1/course-certificate', () => ({
  downloadPublicApiCourseCertificateService: vi.fn(),
  getPublicApiCourseCertificateService: vi.fn(),
  listPublicApiCourseCertificatesService: vi.fn(),
  updatePublicApiCourseCertificateService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

import {
  downloadPublicApiCourseCertificateService,
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';
import { reserveMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { v1Router } from '@api/routes/v1';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';

const mcpKey = {
  id: 'mcp-key',
  organizationId: 'org-1',
  createdByProfileId: 'actor-1',
  type: 'mcp',
  scopes: ['course:certificate:read', 'course:certificate:write']
};

const request = (path: string, init: RequestInit = {}) =>
  v1Router.request(path, {
    ...init,
    headers: { Authorization: 'Bearer cio_mcp_key', 'content-type': 'application/json', ...init.headers }
  });

describe('MCP metering through the nested v1 router', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.authenticate.mockResolvedValue(mcpKey);
    vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
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

  it.each([
    ['get_course_certificate', `/courses/${COURSE_ID}/certificate`, {}],
    [
      'update_course_certificate',
      `/courses/${COURSE_ID}/certificate`,
      { method: 'PATCH', body: JSON.stringify({ isDownloadable: true }) }
    ],
    ['list_course_certificates', `/courses/${COURSE_ID}/certificates`, {}],
    ['download_course_certificate', `/courses/${COURSE_ID}/certificates/${MEMBER_ID}/download`, {}]
  ])('meters %s for an MCP key with the default certificate scopes', async (toolName, path, init) => {
    const response = await request(path, init);

    expect(response.status).toBe(200);
    expect(reserveMcpAutomationUsage).toHaveBeenCalledTimes(1);
    expect(reserveMcpAutomationUsage).toHaveBeenCalledWith(expect.objectContaining({ id: 'mcp-key' }), toolName, {
      courseId: COURSE_ID
    });
  });

  it('passes the key creator as the actor and the key org as the org', async () => {
    await request(`/courses/${COURSE_ID}/certificate`);

    expect(getPublicApiCourseCertificateService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID });
  });
});
