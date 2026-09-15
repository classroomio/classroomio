import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { automationKeyScopeOrSessionMiddleware } from './automation-key-scope-or-session';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

function buildApp(automationKey: { scopes: string[] } | null) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', automationKey);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/presign/video/upload', automationKeyScopeOrSessionMiddleware(['course:write']), (c) =>
      c.json({ success: true })
    );
}

describe('automationKeyScopeOrSessionMiddleware (FIX-03)', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
  });

  it('lets a session caller through unchanged, without ever checking scopes', async () => {
    const app = buildApp(null);
    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(mocks.hasScopes).not.toHaveBeenCalled();
  });

  it('allows an automation key that has the required scope', async () => {
    mocks.hasScopes.mockReturnValue(true);
    const app = buildApp({ scopes: ['course:write'] });
    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(mocks.hasScopes).toHaveBeenCalledWith(['course:write'], ['course:write']);
  });

  it('rejects an automation key missing the required scope', async () => {
    mocks.hasScopes.mockReturnValue(false);
    const app = buildApp({ scopes: ['public_api:*'] });
    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.FORBIDDEN);
  });
});
