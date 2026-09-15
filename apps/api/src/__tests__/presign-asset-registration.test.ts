import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { assertAutomationKeyOwnsDownloadKeys, registerUploadedAsset } from '../routes/course/presign';

const mocks = vi.hoisted(() => ({
  createOrGetAssetByStorageKey: vi.fn(),
  getAssetsByStorageKeys: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  createOrGetAssetByStorageKey: (values: unknown) => mocks.createOrGetAssetByStorageKey(values),
  getAssetsByStorageKeys: (orgId: string, keys: string[]) => mocks.getAssetsByStorageKeys(orgId, keys)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '9b2e1c10-6b3a-4a9e-8a0c-4a2f6b1d7e55';
const PROFILE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

function buildApp(context: { automationKey: { organizationId: string } | null; user: { id: string } | null }) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', context.automationKey);
    c.set('user', context.user);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/upload', async (c) => {
      const { fileKey, fileType, fileSize, kind } = await c.req.json();
      await registerUploadedAsset(c, { fileKey, fileType, fileSize, kind });
      return c.json({ success: true });
    })
    .post('/download', async (c) => {
      const { keys } = await c.req.json();
      const forbidden = await assertAutomationKeyOwnsDownloadKeys(c, keys);
      if (forbidden) return forbidden;
      return c.json({ success: true });
    });
}

describe('registerUploadedAsset (fix for the download-ownership regression)', () => {
  beforeEach(() => {
    mocks.createOrGetAssetByStorageKey.mockReset();
    mocks.getAssetsByStorageKeys.mockReset();
  });

  it('registers the key under the automation key organization, so a later download by the same org succeeds', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'lesson-video.mp4' });
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'lesson-video.mp4' }]);

    const app = buildApp({ automationKey: { organizationId: ORG_ID }, user: null });

    const uploadResponse = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'lesson-video.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });
    expect(uploadResponse.status).toBe(200);
    expect(mocks.createOrGetAssetByStorageKey).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, storageKey: 'lesson-video.mp4', kind: 'video' })
    );

    const downloadResponse = await app.request('/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['lesson-video.mp4'] })
    });
    expect(downloadResponse.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).toHaveBeenCalledWith(ORG_ID, ['lesson-video.mp4']);
  });

  it('does not register the key under a different automation key organization', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'lesson-video.mp4' });

    const app = buildApp({ automationKey: { organizationId: ORG_ID }, user: null });
    await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'lesson-video.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });

    expect(mocks.createOrGetAssetByStorageKey).not.toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: OTHER_ORG_ID })
    );
  });

  it('falls back to the cio-org-id header and the session user id for session callers', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'syllabus.pdf' });

    const app = buildApp({ automationKey: null, user: { id: PROFILE_ID } });
    const response = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cio-org-id': ORG_ID },
      body: JSON.stringify({ fileKey: 'syllabus.pdf', fileType: 'application/pdf', fileSize: 2048, kind: 'document' })
    });

    expect(response.status).toBe(200);
    expect(mocks.createOrGetAssetByStorageKey).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        storageKey: 'syllabus.pdf',
        kind: 'document',
        createdByProfileId: PROFILE_ID
      })
    );
  });

  it('skips registration without throwing when no org context is available at all', async () => {
    const app = buildApp({ automationKey: null, user: null });
    const response = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'orphan.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });

    expect(response.status).toBe(200);
    expect(mocks.createOrGetAssetByStorageKey).not.toHaveBeenCalled();
  });

  it('swallows a DB failure instead of failing the upload response', async () => {
    mocks.createOrGetAssetByStorageKey.mockRejectedValue(new Error('connection reset'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const app = buildApp({ automationKey: { organizationId: ORG_ID }, user: null });
    const response = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'lesson-video.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });

    expect(response.status).toBe(200);
    consoleError.mockRestore();
  });
});
