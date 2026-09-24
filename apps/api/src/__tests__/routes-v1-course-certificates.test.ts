import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/course-certificate', () => ({
  getPublicApiCourseCertificateService: vi.fn(),
  updatePublicApiCourseCertificateService: vi.fn(),
  listPublicApiCourseCertificatesService: vi.fn()
}));

vi.mock('@api/services/v1/course', () => ({
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  assertMcpAutomationUsageAllowed: vi.fn(),
  recordMcpAutomationUsage: vi.fn()
}));

import type { TOrganizationApiKey } from '@cio/db/types';
import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { getCourseService } from '@api/services/v1/course';
import {
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { v1CoursesRouter } from '@api/routes/v1/courses';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

const buildApp = (automationKey: TOrganizationApiKey | null = null) =>
  new Hono()
    .use('*', async (c, next) => {
      c.set('orgId', 'org-1');
      c.set('actorId', 'actor-1');
      c.set('automationKey', automationKey);
      await next();
    })
    .route('/', v1CoursesRouter);

const mcpKey = { id: 'key-1', organizationId: 'org-1', type: 'mcp' } as TOrganizationApiKey;
const apiKey = { id: 'key-2', organizationId: 'org-1', type: 'api' } as TOrganizationApiKey;

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1 course certificate routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the certificate settings from the nested route, not GET /:courseId', async () => {
    vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({ isDownloadable: true });

    const response = await buildApp().request(`/${COURSE_ID}/certificate`);

    expect(response.status).toBe(200);
    expect(getPublicApiCourseCertificateService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID });
    expect(getCourseService).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ success: true, data: { isDownloadable: true } });
  });

  it('updates the certificate settings with the actor and payload', async () => {
    vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({ isDownloadable: false });

    const response = await buildApp().request(
      `/${COURSE_ID}/certificate`,
      jsonRequest('PUT', { isDownloadable: false })
    );

    expect(response.status).toBe(200);
    expect(updatePublicApiCourseCertificateService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { isDownloadable: false }
    );
    expect(await response.json()).toEqual({ success: true, data: { isDownloadable: false } });
  });

  it('rejects an empty update body with 400', async () => {
    const response = await buildApp().request(`/${COURSE_ID}/certificate`, jsonRequest('PUT', {}));

    expect(response.status).toBe(400);
    expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
  });

  it('rejects an invalid design with 400', async () => {
    const response = await buildApp().request(
      `/${COURSE_ID}/certificate`,
      jsonRequest('PUT', { design: { templateId: 'unknown' } })
    );

    expect(response.status).toBe(400);
    expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid course id with 400', async () => {
    const response = await buildApp().request('/not-a-uuid/certificate');

    expect(response.status).toBe(400);
    expect(getPublicApiCourseCertificateService).not.toHaveBeenCalled();
  });

  it('lists issued certificates with default pagination and the paginated envelope', async () => {
    const pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    vi.mocked(listPublicApiCourseCertificatesService).mockResolvedValue({ items: [], pagination });

    const response = await buildApp().request(`/${COURSE_ID}/certificates`);

    expect(response.status).toBe(200);
    expect(listPublicApiCourseCertificatesService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { courseId: COURSE_ID },
      { page: 1, limit: 20 }
    );
    expect(await response.json()).toEqual({ success: true, data: [], pagination });
  });

  it('rejects a limit above 100 with 400', async () => {
    const response = await buildApp().request(`/${COURSE_ID}/certificates?limit=101`);

    expect(response.status).toBe(400);
    expect(listPublicApiCourseCertificatesService).not.toHaveBeenCalled();
  });

  it('maps a service 403 to the response status', async () => {
    vi.mocked(listPublicApiCourseCertificatesService).mockRejectedValue(
      new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403)
    );

    const response = await buildApp().request(`/${COURSE_ID}/certificates`);

    expect(response.status).toBe(403);
  });

  it('meters MCP keys: checks the limit first and records usage after success', async () => {
    vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({ isDownloadable: true });

    const response = await buildApp(mcpKey).request(
      `/${COURSE_ID}/certificate`,
      jsonRequest('PUT', { isDownloadable: true })
    );

    expect(response.status).toBe(200);
    expect(assertMcpAutomationUsageAllowed).toHaveBeenCalledWith(mcpKey, 'update_course_certificate');
    expect(recordMcpAutomationUsage).toHaveBeenCalledWith(mcpKey, 'update_course_certificate', {
      courseId: COURSE_ID
    });
  });

  it('returns 429 and skips the handler when the MCP limit is exceeded', async () => {
    vi.mocked(assertMcpAutomationUsageAllowed).mockRejectedValue(
      new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429)
    );

    const response = await buildApp(mcpKey).request(`/${COURSE_ID}/certificates`);

    expect(response.status).toBe(429);
    expect(listPublicApiCourseCertificatesService).not.toHaveBeenCalled();
    expect(recordMcpAutomationUsage).not.toHaveBeenCalled();
  });

  it('does not record MCP usage when the handler fails', async () => {
    vi.mocked(getPublicApiCourseCertificateService).mockRejectedValue(
      new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404)
    );

    const response = await buildApp(mcpKey).request(`/${COURSE_ID}/certificate`);

    expect(response.status).toBe(404);
    expect(assertMcpAutomationUsageAllowed).toHaveBeenCalledWith(mcpKey, 'get_course_certificate');
    expect(recordMcpAutomationUsage).not.toHaveBeenCalled();
  });

  it('does not meter non-MCP keys', async () => {
    vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({});

    const response = await buildApp(apiKey).request(`/${COURSE_ID}/certificate`);

    expect(response.status).toBe(200);
    expect(assertMcpAutomationUsageAllowed).not.toHaveBeenCalled();
    expect(recordMcpAutomationUsage).not.toHaveBeenCalled();
  });
});
