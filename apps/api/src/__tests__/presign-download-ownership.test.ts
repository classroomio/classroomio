import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { assertCallerOwnsDownloadKeys } from '../routes/course/presign';

const mocks = vi.hoisted(() => ({
  getAssetsByStorageKeys: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByStorageKeys: (orgId: string, keys: string[]) => mocks.getAssetsByStorageKeys(orgId, keys)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

// `assertCallerOwnsDownloadKeys` trusts `c.get('orgId')` as-is: by contract it's only ever set
// by an upstream middleware (orgTeamMemberOrAutomationKeyMiddleware) that has already verified
// the caller — automation key or session — belongs to that organization.
function buildApp(orgId: string | null) {
  const setContext = async (c: Context, next: Next) => {
    c.set('orgId', orgId);
    await next();
  };

  return new Hono().use(setContext).post('/check', async (c) => {
    const { keys } = await c.req.json();
    const forbidden = await assertCallerOwnsDownloadKeys(c, keys);
    if (forbidden) return forbidden;
    return c.json({ success: true });
  });
}

describe('assertCallerOwnsDownloadKeys (downloads ownership check)', () => {
  beforeEach(() => {
    mocks.getAssetsByStorageKeys.mockReset();
  });

  it('skips the check when no org context is available at all', async () => {
    const app = buildApp(null);
    const response = await app.request('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['someone-elses-key.mp4'] })
    });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).not.toHaveBeenCalled();
  });

  it('allows a caller when every requested key belongs to its organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'a.mp4' }, { storageKey: 'b.mp4' }]);
    const app = buildApp(ORG_ID);
    const response = await app.request('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['a.mp4', 'b.mp4'] })
    });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).toHaveBeenCalledWith(ORG_ID, ['a.mp4', 'b.mp4']);
  });

  it('rejects a caller requesting a key from another organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'a.mp4' }]);
    const app = buildApp(ORG_ID);
    const response = await app.request('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['a.mp4', 'b.mp4'] })
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe('FORBIDDEN');
  });
});
