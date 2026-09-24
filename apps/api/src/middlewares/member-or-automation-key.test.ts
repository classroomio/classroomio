import { describe, expect, it } from 'vitest';
import type { Context, Next } from 'hono';

import { Hono } from '@api/utils/hono';
import { ROLE } from '@cio/utils/constants';
import { memberOrAutomationKeyMiddleware } from './member-or-automation-key';

const ORG_ID = 'org-1';

function buildApp(context: {
  automationKey?: { organizationId: string; createdByProfileId: string; scopes: string[] } | null;
  user?: { id: string } | null;
  orgRoles?: Record<string, number>;
}) {
  const setContext = async (c: Context, next: Next) => {
    c.set('automationKey', context.automationKey ?? null);
    c.set('user', context.user ?? null);
    c.set('orgRoles', context.orgRoles ?? {});
    await next();
  };

  return new Hono()
    .use(setContext)
    .use(memberOrAutomationKeyMiddleware(['course:write']))
    .get('/', (c) => c.json({ orgId: c.get('orgId') ?? null, actorId: c.get('actorId') ?? null }));
}

describe('memberOrAutomationKeyMiddleware', () => {
  it('lets a student session through, like the dashboard, without an org so their uploads are not org assets', async () => {
    const app = buildApp({ user: { id: 'student-1' }, orgRoles: { [ORG_ID]: ROLE.STUDENT } });

    const response = await app.request('/', { headers: { 'cio-org-id': ORG_ID } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orgId: null, actorId: 'student-1' });
  });

  it('sets the org for a tutor session so their uploads are registered', async () => {
    const app = buildApp({ user: { id: 'tutor-1' }, orgRoles: { [ORG_ID]: ROLE.TUTOR } });

    const response = await app.request('/', { headers: { 'cio-org-id': ORG_ID } });

    expect(await response.json()).toEqual({ orgId: ORG_ID, actorId: 'tutor-1' });
  });

  it('ignores a cio-org-id header for an org the user does not belong to', async () => {
    const app = buildApp({ user: { id: 'user-1' }, orgRoles: {} });

    const response = await app.request('/', { headers: { 'cio-org-id': 'other-org' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orgId: null, actorId: 'user-1' });
  });

  it('returns 401 with neither a session nor a key', async () => {
    const response = await buildApp({}).request('/');

    expect(response.status).toBe(401);
  });

  it('rejects an automation key without the required scope', async () => {
    const app = buildApp({
      automationKey: { organizationId: ORG_ID, createdByProfileId: 'creator-1', scopes: ['course:read'] }
    });

    const response = await app.request('/');

    expect(response.status).toBe(403);
  });

  it('sets orgId and actorId from an automation key with the scope', async () => {
    const app = buildApp({
      automationKey: { organizationId: ORG_ID, createdByProfileId: 'creator-1', scopes: ['course:write'] }
    });

    const response = await app.request('/');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orgId: ORG_ID, actorId: 'creator-1' });
  });
});
