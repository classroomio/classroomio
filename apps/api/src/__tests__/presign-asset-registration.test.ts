import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { assertCallerOwnsDownloadKeys, registerUploadedAsset } from '../routes/course/presign';

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

// `registerUploadedAsset` / `assertCallerOwnsDownloadKeys` trust `c.get('orgId')` as-is: by
// contract it's only ever set by an upstream middleware (orgTeamMemberOrAutomationKeyMiddleware)
// that has already verified the caller's membership. These tests simulate that middleware having
// already run, rather than re-deriving orgId from a client-supplied header.
function buildApp(context: { orgId: string | null; user: { id: string } | null }) {
  const setContext = async (c: Context, next: Next) => {
    c.set('orgId', context.orgId);
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
      const forbidden = await assertCallerOwnsDownloadKeys(c, keys);
      if (forbidden) return forbidden;
      return c.json({ success: true });
    });
}

describe('registerUploadedAsset / assertCallerOwnsDownloadKeys', () => {
  beforeEach(() => {
    mocks.createOrGetAssetByStorageKey.mockReset();
    mocks.getAssetsByStorageKeys.mockReset();
  });

  it('registers the key under the verified organization, so a later download by the same org succeeds', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'lesson-video.mp4' });
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'lesson-video.mp4' }]);

    const app = buildApp({ orgId: ORG_ID, user: null });

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

  it('does not register the key under a different organization', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'lesson-video.mp4' });

    const app = buildApp({ orgId: ORG_ID, user: null });
    await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'lesson-video.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });

    expect(mocks.createOrGetAssetByStorageKey).not.toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: OTHER_ORG_ID })
    );
  });

  it('registers under the profile id for session callers', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'syllabus.pdf' });

    const app = buildApp({ orgId: ORG_ID, user: { id: PROFILE_ID } });
    const response = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  it('ignores an arbitrary cio-org-id header: only the middleware-verified orgId is trusted', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ storageKey: 'syllabus.pdf' });

    // A session caller verified for ORG_ID sends a header claiming a different org. Since
    // registerUploadedAsset no longer reads the header at all, the spoofed org has no effect.
    const app = buildApp({ orgId: ORG_ID, user: { id: PROFILE_ID } });
    await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cio-org-id': OTHER_ORG_ID },
      body: JSON.stringify({ fileKey: 'syllabus.pdf', fileType: 'application/pdf', fileSize: 2048, kind: 'document' })
    });

    expect(mocks.createOrGetAssetByStorageKey).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID })
    );
    expect(mocks.createOrGetAssetByStorageKey).not.toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: OTHER_ORG_ID })
    );
  });

  it('skips registration without throwing when no org context is available at all', async () => {
    const app = buildApp({ orgId: null, user: null });
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

    const app = buildApp({ orgId: ORG_ID, user: null });
    const response = await app.request('/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: 'lesson-video.mp4', fileType: 'video/mp4', fileSize: 1024, kind: 'video' })
    });

    expect(response.status).toBe(200);
    consoleError.mockRestore();
  });
});
