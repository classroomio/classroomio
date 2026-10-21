import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { orgAdminOrAutomationKeyMiddleware } from './org-admin-or-automation-key';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function buildApp(orgRoles: Record<string, number>) {
  const setContext = async (c: Context, next: Next) => {
    c.set('user', { id: USER_ID });
    c.set('orgRoles', orgRoles);
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/courses/reorder', orgAdminOrAutomationKeyMiddleware(['course:write']), (c) =>
      c.json({ success: true, orgId: c.get('orgId'), actorId: c.get('actorId') })
    );
}

describe('orgAdminOrAutomationKeyMiddleware (courses reorder security)', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
    mocks.hasScopes.mockReturnValue(true);
  });

  it('allows an organization admin', async () => {
    const app = buildApp({ [ORG_ID]: ROLE.ADMIN });
    const response = await app.request('/courses/reorder', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
    expect(body.actorId).toBe(USER_ID);
  });

  it('rejects a non-admin member (e.g. a student or tutor)', async () => {
    const app = buildApp({ [ORG_ID]: ROLE.STUDENT });
    const response = await app.request('/courses/reorder', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.ORG_TEAM_NOT_AUTHORIZED);
  });
});
