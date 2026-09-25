import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/v1/course-certificate', () => ({
  downloadPublicApiCourseCertificateService: vi.fn(),
  getPublicApiCourseCertificateService: vi.fn(),
  updatePublicApiCourseCertificateService: vi.fn(),
  listPublicApiCourseCertificatesService: vi.fn()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  reserveMcpAutomationUsage: vi.fn(),
  releaseMcpAutomationUsage: vi.fn()
}));

vi.mock('@api/utils/certificate', () => ({
  slugifyForFilename: (value: string) => value.replace(/\s+/g, '-')
}));

import type { TOrganizationApiKey } from '@cio/db/types';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';
import { Hono } from '@api/utils/hono';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  downloadPublicApiCourseCertificateService,
  getPublicApiCourseCertificateService,
  listPublicApiCourseCertificatesService,
  updatePublicApiCourseCertificateService
} from '@api/services/v1/course-certificate';
import { releaseMcpAutomationUsage, reserveMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { v1CourseCertificateRouter, v1CourseCertificatesRouter } from '@api/routes/v1/course-certificates';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const CERTIFICATE_PATH = `/courses/${COURSE_ID}/certificate`;
const CERTIFICATES_PATH = `/courses/${COURSE_ID}/certificates`;
const DOWNLOAD_PATH = `${CERTIFICATES_PATH}/${MEMBER_ID}/download`;

const buildKey = (type: TOrganizationApiKey['type'], scopes: TOrganizationApiKeyScope[]) =>
  ({ id: `${type}-key`, organizationId: 'org-1', type, scopes }) as unknown as TOrganizationApiKey;

const apiKey = buildKey('api', ['public_api:*']);
const mcpKey = buildKey('mcp', ['course:read', 'course:certificate:read', 'course:certificate:write']);

const buildApp = (automationKey: TOrganizationApiKey | null = apiKey) =>
  new Hono()
    .use('*', async (c, next) => {
      c.set('orgId', 'org-1');
      c.set('actorId', 'actor-1');
      c.set('automationKey', automationKey);
      await next();
    })
    .route('/courses/:courseId/certificate', v1CourseCertificateRouter)
    .route('/courses/:courseId/certificates', v1CourseCertificatesRouter);

const jsonRequest = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

describe('v1 course certificate routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(reserveMcpAutomationUsage).mockResolvedValue('usage-1');
  });

  describe('settings', () => {
    it('returns the certificate settings for the course', async () => {
      vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({ isDownloadable: true } as never);

      const response = await buildApp().request(CERTIFICATE_PATH);

      expect(response.status).toBe(200);
      expect(getPublicApiCourseCertificateService).toHaveBeenCalledWith('org-1', 'actor-1', { courseId: COURSE_ID });
      expect(await response.json()).toEqual({ success: true, data: { isDownloadable: true } });
    });

    it('updates the certificate settings with PATCH', async () => {
      vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({ isDownloadable: false } as never);

      const response = await buildApp().request(CERTIFICATE_PATH, jsonRequest('PATCH', { isDownloadable: false }));

      expect(response.status).toBe(200);
      expect(updatePublicApiCourseCertificateService).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        { courseId: COURSE_ID },
        { isDownloadable: false }
      );
      expect(await response.json()).toEqual({ success: true, data: { isDownloadable: false } });
    });

    it('does not accept PUT', async () => {
      const response = await buildApp().request(CERTIFICATE_PATH, jsonRequest('PUT', { isDownloadable: false }));

      expect(response.status).toBe(404);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('passes null through so clients can clear nullable fields', async () => {
      vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({} as never);

      const response = await buildApp().request(CERTIFICATE_PATH, jsonRequest('PATCH', { deadline: null }));

      expect(response.status).toBe(200);
      expect(updatePublicApiCourseCertificateService).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        { courseId: COURSE_ID },
        { deadline: null }
      );
    });

    it.each(['tomorrow', 'not-a-date', '2026-12-31'])('rejects the deadline %j with 400', async (deadline) => {
      const response = await buildApp().request(CERTIFICATE_PATH, jsonRequest('PATCH', { deadline }));

      expect(response.status).toBe(400);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('rejects an empty update body with 400', async () => {
      const response = await buildApp().request(CERTIFICATE_PATH, jsonRequest('PATCH', {}));

      expect(response.status).toBe(400);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('rejects an invalid design with 400', async () => {
      const response = await buildApp().request(
        CERTIFICATE_PATH,
        jsonRequest('PATCH', { design: { templateId: 'unknown' } })
      );

      expect(response.status).toBe(400);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('rejects a non-uuid course id with 400', async () => {
      const response = await buildApp().request('/courses/not-a-uuid/certificate');

      expect(response.status).toBe(400);
      expect(getPublicApiCourseCertificateService).not.toHaveBeenCalled();
    });
  });

  describe('issuance history', () => {
    it('lists issued certificates with default pagination and the paginated envelope', async () => {
      const pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
      vi.mocked(listPublicApiCourseCertificatesService).mockResolvedValue({ items: [], pagination });

      const response = await buildApp().request(CERTIFICATES_PATH);

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
      const response = await buildApp().request(`${CERTIFICATES_PATH}?limit=101`);

      expect(response.status).toBe(400);
      expect(listPublicApiCourseCertificatesService).not.toHaveBeenCalled();
    });

    it('maps a service 403 to the response status', async () => {
      vi.mocked(listPublicApiCourseCertificatesService).mockRejectedValue(
        new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      );

      const response = await buildApp().request(CERTIFICATES_PATH);

      expect(response.status).toBe(403);
    });
  });

  describe('download', () => {
    it('streams the PDF by default with a download filename', async () => {
      const file = new Uint8Array([37, 80, 68, 70]);
      vi.mocked(downloadPublicApiCourseCertificateService).mockResolvedValue({
        file,
        format: 'pdf',
        courseName: 'Intro Course'
      } as never);

      const response = await buildApp().request(DOWNLOAD_PATH);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toBe('attachment; filename="certificate-Intro-Course.pdf"');
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(file);
      expect(downloadPublicApiCourseCertificateService).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        { courseId: COURSE_ID, memberId: MEMBER_ID },
        { format: 'pdf' }
      );
    });

    it('returns a PNG when asked', async () => {
      vi.mocked(downloadPublicApiCourseCertificateService).mockResolvedValue({
        file: new Uint8Array([1]),
        format: 'png',
        courseName: 'Intro'
      } as never);

      const response = await buildApp().request(`${DOWNLOAD_PATH}?format=png`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    it('rejects an unknown format and a non-uuid member id with 400', async () => {
      const badFormat = await buildApp().request(`${DOWNLOAD_PATH}?format=jpg`);
      const badMember = await buildApp().request(`${CERTIFICATES_PATH}/member-1/download`);

      expect(badFormat.status).toBe(400);
      expect(badMember.status).toBe(400);
      expect(downloadPublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('maps a missing certificate to 404', async () => {
      vi.mocked(downloadPublicApiCourseCertificateService).mockRejectedValue(
        new AppError('Certificate not found', ErrorCodes.NOT_FOUND, 404)
      );

      const response = await buildApp().request(DOWNLOAD_PATH);

      expect(response.status).toBe(404);
    });
  });

  describe('scope enforcement', () => {
    const readOnlyKey = buildKey('mcp', ['course:certificate:read']);
    const writeOnlyKey = buildKey('mcp', ['course:certificate:write']);
    const unrelatedKey = buildKey('mcp', ['course:read', 'course:write']);

    it.each([
      ['GET settings', CERTIFICATE_PATH, undefined],
      ['GET history', CERTIFICATES_PATH, undefined],
      ['GET download', DOWNLOAD_PATH, undefined],
      ['PATCH settings', CERTIFICATE_PATH, jsonRequest('PATCH', { isDownloadable: true })]
    ])('%s returns 403 for a key without a certificate or public_api scope', async (_name, path, init) => {
      const response = await buildApp(unrelatedKey).request(path, init);

      expect(response.status).toBe(403);
      expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
    });

    it('returns 401 without a key', async () => {
      const response = await buildApp(null).request(CERTIFICATE_PATH);

      expect(response.status).toBe(401);
    });

    it('lets a read-scoped key read but not update', async () => {
      vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({} as never);

      const read = await buildApp(readOnlyKey).request(CERTIFICATE_PATH);
      const write = await buildApp(readOnlyKey).request(
        CERTIFICATE_PATH,
        jsonRequest('PATCH', { isDownloadable: true })
      );

      expect(read.status).toBe(200);
      expect(write.status).toBe(403);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('lets a write-scoped key update but not read', async () => {
      vi.mocked(updatePublicApiCourseCertificateService).mockResolvedValue({} as never);

      const write = await buildApp(writeOnlyKey).request(
        CERTIFICATE_PATH,
        jsonRequest('PATCH', { isDownloadable: true })
      );
      const read = await buildApp(writeOnlyKey).request(CERTIFICATES_PATH);

      expect(write.status).toBe(200);
      expect(read.status).toBe(403);
    });
  });

  describe('MCP usage metering', () => {
    it('reserves usage before the handler runs and keeps it on success', async () => {
      const callOrder: string[] = [];
      vi.mocked(reserveMcpAutomationUsage).mockImplementation(async () => {
        callOrder.push('reserve');
        return 'usage-1';
      });
      vi.mocked(updatePublicApiCourseCertificateService).mockImplementation(async () => {
        callOrder.push('handler');
        return {} as never;
      });

      const response = await buildApp(mcpKey).request(CERTIFICATE_PATH, jsonRequest('PATCH', { isDownloadable: true }));

      expect(response.status).toBe(200);
      expect(callOrder).toEqual(['reserve', 'handler']);
      expect(reserveMcpAutomationUsage).toHaveBeenCalledWith(mcpKey, 'update_course_certificate', {
        courseId: COURSE_ID
      });
      expect(releaseMcpAutomationUsage).not.toHaveBeenCalled();
    });

    it('meters the download tool', async () => {
      vi.mocked(downloadPublicApiCourseCertificateService).mockResolvedValue({
        file: new Uint8Array([1]),
        format: 'pdf',
        courseName: 'Intro'
      } as never);

      const response = await buildApp(mcpKey).request(DOWNLOAD_PATH);

      expect(response.status).toBe(200);
      expect(reserveMcpAutomationUsage).toHaveBeenCalledWith(mcpKey, 'download_course_certificate', {
        courseId: COURSE_ID
      });
    });

    it('returns 429 and skips the handler when the MCP limit is exceeded', async () => {
      vi.mocked(reserveMcpAutomationUsage).mockRejectedValue(
        new AppError('Automation rate limit exceeded', ErrorCodes.AUTOMATION_RATE_LIMIT_EXCEEDED, 429)
      );

      const response = await buildApp(mcpKey).request(CERTIFICATES_PATH);

      expect(response.status).toBe(429);
      expect(listPublicApiCourseCertificatesService).not.toHaveBeenCalled();
      expect(releaseMcpAutomationUsage).not.toHaveBeenCalled();
    });

    it('fails closed: when usage cannot be reserved the handler never runs', async () => {
      vi.mocked(reserveMcpAutomationUsage).mockRejectedValue(new Error('connection refused'));

      const response = await buildApp(mcpKey).request(CERTIFICATE_PATH, jsonRequest('PATCH', { isDownloadable: true }));

      expect(response.status).toBe(500);
      expect(updatePublicApiCourseCertificateService).not.toHaveBeenCalled();
    });

    it('releases the reservation when the handler fails', async () => {
      vi.mocked(getPublicApiCourseCertificateService).mockRejectedValue(
        new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404)
      );

      const response = await buildApp(mcpKey).request(CERTIFICATE_PATH);

      expect(response.status).toBe(404);
      expect(reserveMcpAutomationUsage).toHaveBeenCalledWith(mcpKey, 'get_course_certificate', {
        courseId: COURSE_ID
      });
      expect(releaseMcpAutomationUsage).toHaveBeenCalledWith('usage-1');
    });

    it('keeps the handler response when releasing the reservation fails', async () => {
      vi.mocked(getPublicApiCourseCertificateService).mockRejectedValue(
        new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      );
      vi.mocked(releaseMcpAutomationUsage).mockRejectedValue(new Error('connection refused'));

      const response = await buildApp(mcpKey).request(CERTIFICATE_PATH);

      expect(response.status).toBe(403);
    });

    it('does not meter non-MCP keys', async () => {
      vi.mocked(getPublicApiCourseCertificateService).mockResolvedValue({} as never);

      const response = await buildApp(apiKey).request(CERTIFICATE_PATH);

      expect(response.status).toBe(200);
      expect(reserveMcpAutomationUsage).not.toHaveBeenCalled();
    });
  });
});
