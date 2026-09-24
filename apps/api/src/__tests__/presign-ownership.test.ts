import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

const mocks = vi.hoisted(() => ({
  createOrGetAssetByStorageKey: vi.fn(),
  getAssetsByStorageKeys: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  createOrGetAssetByStorageKey: (values: unknown) => mocks.createOrGetAssetByStorageKey(values),
  getAssetsByStorageKeys: (orgId: string, keys: string[]) => mocks.getAssetsByStorageKeys(orgId, keys)
}));

import { assertCallerOwnsDownloadKeys, registerUploadedAsset } from '../routes/course/presign';

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const ACTOR_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

type TCallerContext = { orgId: string | null; actorId: string | null; automationKey: object | null };

function buildApp(context: TCallerContext) {
  const setContext = async (c: Context, next: Next) => {
    c.set('orgId', context.orgId);
    c.set('actorId', context.actorId);
    c.set('automationKey', context.automationKey);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/upload', async (c) => {
      const { fileKey } = await c.req.json();
      await registerUploadedAsset(c, { fileKey, fileType: 'video/mp4', fileSize: 10, kind: 'video' });
      return c.json({ success: true });
    })
    .post('/download', async (c) => {
      const { keys } = await c.req.json();
      const forbidden = await assertCallerOwnsDownloadKeys(c, keys);
      if (forbidden) return forbidden;
      return c.json({ success: true });
    });
}

const post = (app: ReturnType<typeof buildApp>, path: string, body: unknown) =>
  app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const keyCaller: TCallerContext = { orgId: ORG_ID, actorId: ACTOR_ID, automationKey: { id: 'key-1' } };

describe('presign download ownership', () => {
  beforeEach(() => {
    mocks.getAssetsByStorageKeys.mockReset();
  });

  it('skips the check for signed-in users, as on main, so legacy uploads keep working', async () => {
    const app = buildApp({ orgId: null, actorId: ACTOR_ID, automationKey: null });

    const response = await post(app, '/download', { keys: ['legacy.mp4'] });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).not.toHaveBeenCalled();
  });

  it('allows an automation key when every key belongs to its organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'a.mp4' }]);

    const response = await post(buildApp(keyCaller), '/download', { keys: ['a.mp4'] });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).toHaveBeenCalledWith(ORG_ID, ['a.mp4']);
  });

  it('rejects an automation key asking for a key from another organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([]);

    const response = await post(buildApp(keyCaller), '/download', { keys: ['someone-elses.mp4'] });

    expect(response.status).toBe(403);
  });

  it('fails closed for an automation key with no organization', async () => {
    const response = await post(buildApp({ ...keyCaller, orgId: null }), '/download', { keys: ['a.mp4'] });

    expect(response.status).toBe(403);
    expect(mocks.getAssetsByStorageKeys).not.toHaveBeenCalled();
  });
});

describe('presign upload asset registration', () => {
  beforeEach(() => {
    mocks.createOrGetAssetByStorageKey.mockReset();
  });

  it('registers the upload under the caller organization and actor', async () => {
    mocks.createOrGetAssetByStorageKey.mockResolvedValue({ id: 'asset-1' });

    const response = await post(buildApp(keyCaller), '/upload', { fileKey: 'lesson.mp4' });

    expect(response.status).toBe(200);
    expect(mocks.createOrGetAssetByStorageKey).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, storageKey: 'lesson.mp4', createdByProfileId: ACTOR_ID })
    );
  });

  it('skips registration when no organization is known', async () => {
    const app = buildApp({ orgId: null, actorId: ACTOR_ID, automationKey: null });

    const response = await post(app, '/upload', { fileKey: 'lesson.mp4' });

    expect(response.status).toBe(200);
    expect(mocks.createOrGetAssetByStorageKey).not.toHaveBeenCalled();
  });

  it('does not fail the upload when registration fails', async () => {
    mocks.createOrGetAssetByStorageKey.mockRejectedValue(new Error('db down'));

    const response = await post(buildApp(keyCaller), '/upload', { fileKey: 'lesson.mp4' });

    expect(response.status).toBe(200);
  });
});
