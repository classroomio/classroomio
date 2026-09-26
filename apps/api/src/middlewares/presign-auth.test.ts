import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { findUnauthorizedDownloadKeys, presignAuthMiddleware } from './presign-auth';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';
const KEY_CREATOR_ID = 'd4c3b2a1-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

type ContextSeed = {
  orgRoles?: Record<string, number>;
  automationKey?: { organizationId: string; scopes: string[]; createdByProfileId: string } | null;
  requestedOrgId?: string;
};

function buildApp(seed: ContextSeed) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', seed.automationKey ? null : { id: USER_ID });
    c.set('orgRoles', seed.orgRoles ?? {});
    c.set('automationKey', seed.automationKey ?? null);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/video/upload', presignAuthMiddleware(['course:write']), (c) =>
      c.json({ success: true, uploadOrgId: c.get('presignUploadOrgId') ?? null })
    )
    .post('/video/download', presignAuthMiddleware(['course:write']), async (c) => {
      const { keys } = await c.req.json<{ keys: string[] }>();
      const unauthorizedKeys = findUnauthorizedDownloadKeys(c, keys);

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

describe('presignAuthMiddleware', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
    mocks.hasScopes.mockReturnValue(true);
  });

  describe('session callers keep working regardless of org role', () => {
    it.each([
      ['student', ROLE.STUDENT],
      ['tutor', ROLE.TUTOR],
      ['admin', ROLE.ADMIN]
    ])('allows a %s to presign an upload', async (_label, roleId) => {
      const app = buildApp({ orgRoles: { [ORG_ID]: roleId } });
      const response = await post(app, '/video/upload', {}, { 'cio-org-id': ORG_ID });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: ORG_ID });
    });

    it('allows a student to presign a download for their own org', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.STUDENT } });
      const response = await post(app, '/video/download', { keys: [`${ORG_ID}/abc-lesson.mp4`] });

      expect(response.status).toBe(200);
    });

    it('does not require scopes for a session caller', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.STUDENT } });
      await post(app, '/video/upload', {}, { 'cio-org-id': ORG_ID });

      expect(mocks.hasScopes).not.toHaveBeenCalled();
    });
  });

  describe('upload key scoping', () => {
    it('ignores a cio-org-id the caller is not a member of', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.ADMIN } });
      const response = await post(app, '/video/upload', {}, { 'cio-org-id': OTHER_ORG_ID });

      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: null });
    });

    it('scopes automation-key uploads to the key organization', async () => {
      const app = buildApp({
        automationKey: { organizationId: ORG_ID, scopes: ['course:write'], createdByProfileId: KEY_CREATOR_ID }
      });
      const response = await post(app, '/video/upload');

      await expect(response.json()).resolves.toEqual({ success: true, uploadOrgId: ORG_ID });
    });
  });

  describe('automation-key scopes', () => {
    it('rejects a key missing the required scope', async () => {
      mocks.hasScopes.mockReturnValue(false);
      const app = buildApp({
        automationKey: { organizationId: ORG_ID, scopes: [], createdByProfileId: KEY_CREATOR_ID }
      });
      const response = await post(app, '/video/upload');

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ code: ErrorCodes.FORBIDDEN });
    });

    it('checks the scope the route asked for', async () => {
      const app = buildApp({
        automationKey: { organizationId: ORG_ID, scopes: ['course:write'], createdByProfileId: KEY_CREATOR_ID }
      });
      await post(app, '/video/upload');

      expect(mocks.hasScopes).toHaveBeenCalledWith(['course:write'], ['course:write']);
    });
  });

  describe('download key ownership', () => {
    it('rejects a key owned by another organization', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.ADMIN } });
      const response = await post(app, '/video/download', { keys: [`${OTHER_ORG_ID}/secret.mp4`] });

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        unauthorizedKeys: [`${OTHER_ORG_ID}/secret.mp4`]
      });
    });

    it('rejects a cross-org key smuggled in alongside an owned one', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.ADMIN } });
      const response = await post(app, '/video/download', {
        keys: [`${ORG_ID}/mine.mp4`, `${OTHER_ORG_ID}/theirs.mp4`]
      });

      expect(response.status).toBe(403);
    });

    it('rejects a cross-org key for an automation caller', async () => {
      const app = buildApp({
        automationKey: { organizationId: ORG_ID, scopes: ['course:write'], createdByProfileId: KEY_CREATOR_ID }
      });
      const response = await post(app, '/video/download', { keys: [`${OTHER_ORG_ID}/theirs.mp4`] });

      expect(response.status).toBe(403);
    });

    it('allows a legacy key that carries no organization prefix', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.STUDENT } });
      const response = await post(app, '/video/download', { keys: ['V1StGXR8Z5jdHi6B-lesson.mp4'] });

      expect(response.status).toBe(200);
    });

    it('allows keys across every org the caller belongs to', async () => {
      const app = buildApp({ orgRoles: { [ORG_ID]: ROLE.STUDENT, [OTHER_ORG_ID]: ROLE.ADMIN } });
      const response = await post(app, '/video/download', {
        keys: [`${ORG_ID}/a.mp4`, `${OTHER_ORG_ID}/b.mp4`]
      });

      expect(response.status).toBe(200);
    });
  });
});
