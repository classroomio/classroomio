import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { findUnauthorizedDownloadKeys, resolveUploadOrganizationId } from './presign-auth';

const mocks = vi.hoisted(() => ({
  legacyOwners: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetOrganizationIdsByStorageKeys: (keys: string[]) => mocks.legacyOwners(keys)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function buildApp(orgRoles: Record<string, number>) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: USER_ID });
    c.set('orgRoles', orgRoles);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/video/upload', (c) => c.json({ success: true, uploadOrgId: resolveUploadOrganizationId(c) ?? null }))
    .post('/video/download', async (c) => {
      const { keys } = await c.req.json<{ keys: string[] }>();
      const unauthorizedKeys = await findUnauthorizedDownloadKeys(c, keys);

      if (unauthorizedKeys.length > 0) {
        return c.json({ success: false, code: ErrorCodes.FORBIDDEN, unauthorizedKeys }, 403);
      }

      return c.json({ success: true });
    });
}

function post(app: ReturnType<typeof buildApp>, path: string, body?: unknown, headers?: Record<string, string>) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {})
  });
}

describe('presign authorization helpers', () => {
  beforeEach(() => {
    mocks.legacyOwners.mockReset();
    mocks.legacyOwners.mockResolvedValue(new Map());
  });

  describe('every org role can presign, because students need these routes', () => {
    it.each([
      ['student', ROLE.STUDENT],
      ['tutor', ROLE.TUTOR],
      ['admin', ROLE.ADMIN]
    ])('resolves an upload organization for a %s', async (_label, roleId) => {
      const app = buildApp({ [ORG_ID]: roleId });
      const response = await post(app, '/video/upload', {}, { 'cio-org-id': ORG_ID });

      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: ORG_ID });
    });

    it('lets a student download a key owned by their organization', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.STUDENT });
      const response = await post(app, '/video/download', { keys: [`${ORG_ID}/abc-lesson.mp4`] });

      expect(response.status).toBe(200);
    });
  });

  describe('upload key scoping', () => {
    it('ignores an organization the caller does not belong to', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/upload', {}, { 'cio-org-id': OTHER_ORG_ID });

      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: null });
    });

    it('mints an unprefixed key when no organization is named', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/upload');

      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: null });
    });
  });

  describe('download key ownership', () => {
    it('rejects a key owned by another organization', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/download', { keys: [`${OTHER_ORG_ID}/secret.mp4`] });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ unauthorizedKeys: [`${OTHER_ORG_ID}/secret.mp4`] });
    });

    it('rejects a cross-org key smuggled in alongside an owned one', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/download', {
        keys: [`${ORG_ID}/mine.mp4`, `${OTHER_ORG_ID}/theirs.mp4`]
      });

      expect(response.status).toBe(403);
    });

    it('allows keys across every org the caller belongs to', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.STUDENT, [OTHER_ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/download', {
        keys: [`${ORG_ID}/a.mp4`, `${OTHER_ORG_ID}/b.mp4`]
      });

      expect(response.status).toBe(200);
    });

    it('allows a legacy key no asset claims, so exercise submissions keep downloading', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.STUDENT });
      const response = await post(app, '/video/download', { keys: ['V1StGXR8Z5jdHi6B-lesson.mp4'] });

      expect(response.status).toBe(200);
      expect(mocks.legacyOwners).toHaveBeenCalledWith(['V1StGXR8Z5jdHi6B-lesson.mp4']);
    });

    it('rejects a legacy key owned by another organization', async () => {
      mocks.legacyOwners.mockResolvedValue(new Map([['V1StGXR8Z5jdHi6B-secret.mp4', [OTHER_ORG_ID]]]));
      const app = buildApp({ [ORG_ID]: ROLE.STUDENT });
      const response = await post(app, '/video/download', { keys: ['V1StGXR8Z5jdHi6B-secret.mp4'] });

      expect(response.status).toBe(403);
    });

    it('rejects a legacy key registered by more than one organization', async () => {
      mocks.legacyOwners.mockResolvedValue(new Map([['shared.mp4', [ORG_ID, OTHER_ORG_ID]]]));
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      const response = await post(app, '/video/download', { keys: ['shared.mp4'] });

      expect(response.status).toBe(403);
    });

    it('does not hit the asset table when every key carries a prefix', async () => {
      const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
      await post(app, '/video/download', { keys: [`${ORG_ID}/a.mp4`] });

      expect(mocks.legacyOwners).not.toHaveBeenCalled();
    });
  });
});
