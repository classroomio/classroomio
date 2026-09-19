import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import type { Context, Next } from 'hono';

import { orgTeamMemberOrAutomationKeyMiddleware } from './org-team-member-or-automation-key';

const mocks = vi.hoisted(() => ({
  hasScopes: vi.fn()
}));

vi.mock('@api/services/organization/automation-key', () => ({
  organizationApiKeyHasScopes: (scopes: string[], requiredScopes: string[]) => mocks.hasScopes(scopes, requiredScopes)
}));

const ORG_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_ORG_ID = '9b2e1c10-6b3a-4a9e-8a0c-4a2f6b1d7e55';
const USER_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

function buildApp(context: {
  automationKey: { organizationId: string; scopes?: string[]; createdByProfileId?: string } | null;
  user: { id: string } | null;
  orgRoles?: Record<string, number>;
}) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', context.automationKey);
    c.set('user', context.user);
    c.set('orgRoles', context.orgRoles ?? {});
    await next();
  };

  return new Hono()
    .use(setContext)
    .post('/presign/video/upload', orgTeamMemberOrAutomationKeyMiddleware(['course:write']), (c) =>
      c.json({ success: true, orgId: c.get('orgId'), actorId: c.get('actorId') })
    );
}

describe('orgTeamMemberOrAutomationKeyMiddleware', () => {
  beforeEach(() => {
    mocks.hasScopes.mockReset();
  });

  it('allows an automation key that has the required scope', async () => {
    mocks.hasScopes.mockReturnValue(true);
    const app = buildApp({ automationKey: { organizationId: ORG_ID, scopes: ['course:write'] }, user: null });

    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
  });

  it('rejects an automation key missing the required scope', async () => {
    mocks.hasScopes.mockReturnValue(false);
    const app = buildApp({ automationKey: { organizationId: ORG_ID, scopes: ['public_api:*'] }, user: null });

    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.FORBIDDEN);
  });

  it('allows a session user with the ADMIN role for the header org', async () => {
    const app = buildApp({ automationKey: null, user: { id: USER_ID }, orgRoles: { [ORG_ID]: ROLE.ADMIN } });

    const response = await app.request('/presign/video/upload', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.orgId).toBe(ORG_ID);
    expect(body.actorId).toBe(USER_ID);
  });

  it('allows a session user with the TUTOR role for the header org', async () => {
    const app = buildApp({ automationKey: null, user: { id: USER_ID }, orgRoles: { [ORG_ID]: ROLE.TUTOR } });

    const response = await app.request('/presign/video/upload', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(200);
  });

  it('rejects a session user with no role in the header org (arbitrary header, not their org)', async () => {
    const app = buildApp({ automationKey: null, user: { id: USER_ID }, orgRoles: { [OTHER_ORG_ID]: ROLE.ADMIN } });

    const response = await app.request('/presign/video/upload', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.ORG_TEAM_NOT_AUTHORIZED);
  });

  it('rejects a session user who is only a STUDENT in the header org', async () => {
    const app = buildApp({ automationKey: null, user: { id: USER_ID }, orgRoles: { [ORG_ID]: ROLE.STUDENT } });

    const response = await app.request('/presign/video/upload', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(403);
  });

  it('rejects a session request missing the cio-org-id header', async () => {
    const app = buildApp({ automationKey: null, user: { id: USER_ID }, orgRoles: { [ORG_ID]: ROLE.ADMIN } });

    const response = await app.request('/presign/video/upload', { method: 'POST' });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('ORG_ID_REQUIRED');
  });

  it('rejects an unauthenticated caller', async () => {
    const app = buildApp({ automationKey: null, user: null });

    const response = await app.request('/presign/video/upload', {
      method: 'POST',
      headers: { 'cio-org-id': ORG_ID }
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.code).toBe(ErrorCodes.UNAUTHORIZED);
  });
});
