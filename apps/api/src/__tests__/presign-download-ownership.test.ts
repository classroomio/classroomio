import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { assertAutomationKeyOwnsDownloadKeys } from '../routes/course/presign';

const mocks = vi.hoisted(() => ({
  getAssetsByStorageKeys: vi.fn()
}));

vi.mock('@cio/db/queries/assets', () => ({
  getAssetsByStorageKeys: (orgId: string, keys: string[]) => mocks.getAssetsByStorageKeys(orgId, keys)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

function buildApp(automationKey: { organizationId: string } | null) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', automationKey);
    await next();
  };

  return new Hono().use(setContext).post('/check', async (c) => {
    const { keys } = await c.req.json();
    const forbidden = await assertAutomationKeyOwnsDownloadKeys(c, keys);
    if (forbidden) return forbidden;
    return c.json({ success: true });
  });
}

describe('assertAutomationKeyOwnsDownloadKeys (downloads ownership check)', () => {
  beforeEach(() => {
    mocks.getAssetsByStorageKeys.mockReset();
  });

  it('skips the check entirely for session callers, preserving existing behavior', async () => {
    const app = buildApp(null);
    const response = await app.request('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['someone-elses-key.mp4'] })
    });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).not.toHaveBeenCalled();
  });

  it('allows an automation key when every requested key belongs to its organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'a.mp4' }, { storageKey: 'b.mp4' }]);
    const app = buildApp({ organizationId: ORG_ID });
    const response = await app.request('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['a.mp4', 'b.mp4'] })
    });

    expect(response.status).toBe(200);
    expect(mocks.getAssetsByStorageKeys).toHaveBeenCalledWith(ORG_ID, ['a.mp4', 'b.mp4']);
  });

  it('rejects an automation key requesting a key from another organization', async () => {
    mocks.getAssetsByStorageKeys.mockResolvedValue([{ storageKey: 'a.mp4' }]);
    const app = buildApp({ organizationId: ORG_ID });
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
