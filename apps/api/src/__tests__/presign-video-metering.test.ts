import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  assertAllowed: vi.fn(),
  recordUsage: vi.fn()
}));

vi.mock('@api/middlewares/auth-or-automation-key', () => ({
  authOrAutomationKeyMiddleware: async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/organization/automation-usage', () => ({
  assertMcpAutomationUsageAllowed: mocks.assertAllowed,
  recordMcpAutomationUsage: mocks.recordUsage
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateVideoUploadPresignedUrl: vi.fn().mockResolvedValue('https://storage.example.com/put'),
  generateDocumentUploadPresignedUrl: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn(),
  generateDocumentDownloadPresignedUrls: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  createOrGetAssetByStorageKey: vi.fn().mockResolvedValue({ id: 'asset-1' }),
  getAssetsByStorageKeys: vi.fn()
}));

import { Hono } from '@api/utils/hono';
import { presignRouter } from '@api/routes/course/presign';

function buildApp(keyType: 'mcp' | 'api') {
  return new Hono()
    .use('*', async (c, next) => {
      c.set('automationKey', {
        id: 'key-1',
        type: keyType,
        organizationId: 'org-1',
        createdByProfileId: 'creator-1',
        scopes: ['course:write']
      } as never);
      await next();
    })
    .route('/', presignRouter);
}

const uploadRequest = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileName: 'intro.mp4', fileType: 'video/mp4', fileSize: 1024 })
};

describe('video upload presign metering', () => {
  beforeEach(() => {
    mocks.assertAllowed.mockReset();
    mocks.recordUsage.mockReset();
  });

  it('checks and records upload_video for MCP keys', async () => {
    const response = await buildApp('mcp').request('/video/upload', uploadRequest);

    expect(response.status).toBe(200);
    expect(mocks.assertAllowed).toHaveBeenCalledWith(expect.objectContaining({ id: 'key-1' }), 'upload_video');
    expect(mocks.recordUsage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'key-1' }),
      'upload_video',
      expect.objectContaining({ fileKey: expect.any(String) })
    );
  });

  it('does not meter non-MCP keys', async () => {
    const response = await buildApp('api').request('/video/upload', uploadRequest);

    expect(response.status).toBe(200);
    expect(mocks.assertAllowed).not.toHaveBeenCalled();
    expect(mocks.recordUsage).not.toHaveBeenCalled();
  });
});
