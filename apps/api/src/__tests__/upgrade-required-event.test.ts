import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  captureServerEvent: vi.fn(),
  isServerEventsEnabled: vi.fn()
}));

vi.mock('@cio/core/services/posthog', () => ({
  captureServerEvent: mocks.captureServerEvent,
  isServerEventsEnabled: mocks.isServerEventsEnabled
}));

import type { AuthSession } from '@api/types/auth';
import { upgradeRequiredEvent } from '@api/middlewares/upgrade-required-event';

function buildApp() {
  return new Hono<AuthSession>()
    .use('*', upgradeRequiredEvent)
    .use('*', async (c, next) => {
      c.set('user', { id: 'user-1' } as AuthSession['Variables']['user']);
      await next();
    })
    .post('/organization/:orgId/sso', (c) => c.json({ success: false, code: 'UPGRADE_REQUIRED' }, 403))
    .post('/organization/workspaces', (c) => c.json({ success: false, code: 'PLAN_UPGRADE_REQUIRED' }, 402))
    .get('/forbidden', (c) => c.json({ success: false, code: 'FORBIDDEN' }, 403))
    .get('/ok', (c) => c.json({ success: true }));
}

const orgId = '0b6f1f43-6e8c-4f5c-9a51-6d0c5f1e2a11';

describe('upgrade_required', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isServerEventsEnabled.mockReturnValue(true);
  });

  it('fires when a request is refused with UPGRADE_REQUIRED', async () => {
    const res = await buildApp().request(`/organization/${orgId}/sso`, {
      method: 'POST',
      headers: { 'cio-org-id': orgId }
    });

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'UPGRADE_REQUIRED' });
    expect(mocks.captureServerEvent).toHaveBeenCalledWith({
      event: 'upgrade_required',
      distinctId: 'user-1',
      orgId,
      properties: { endpoint: 'POST /organization/:id/sso', source: 'dashboard' }
    });
  });

  it('fires for PLAN_UPGRADE_REQUIRED', async () => {
    await buildApp().request('/organization/workspaces', { method: 'POST' });

    expect(mocks.captureServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'upgrade_required',
        properties: expect.objectContaining({ source: 'dashboard' })
      })
    );
  });

  it('ignores other errors and successful responses', async () => {
    const app = buildApp();

    await app.request('/forbidden');
    await app.request('/ok');

    expect(mocks.captureServerEvent).not.toHaveBeenCalled();
  });

  it('does nothing when server events are off', async () => {
    mocks.isServerEventsEnabled.mockReturnValue(false);

    await buildApp().request(`/organization/${orgId}/sso`, { method: 'POST' });

    expect(mocks.captureServerEvent).not.toHaveBeenCalled();
  });
});
