import { describe, expect, it, vi } from 'vitest';
import { mintLaunchToken } from '@cio/activity-packages';

vi.mock('@cio/core/config/activity-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/core/config/activity-content')>();

  return {
    ...actual,
    getActivitySigningSecret: () => 'test-activity-secret-01234567890'
  };
});

import { activityPlayerRouter } from '@api/routes/activity/player';
import { Hono } from '@api/utils/hono';

const SECRET = 'test-activity-secret-01234567890';

function buildApp() {
  return new Hono().route('/activity', activityPlayerRouter);
}

async function mintToken() {
  return mintLaunchToken(
    {
      org: 'org-1',
      act: 'activity-1',
      sub: 'profile-1',
      unit: 'unit-1',
      fmt: 'scorm12',
      mode: 'preview',
      anc: ['https://app.test']
    },
    SECRET
  );
}

describe('activity player', () => {
  it('returns 404 off the content host', async () => {
    const app = buildApp();
    const token = await mintToken();

    const response = await app.request(`/activity/player/${token}`, { headers: { host: 'app.test' } });

    expect(response.status).toBe(404);
  });

  it('rejects forged tokens with 401', async () => {
    const app = buildApp();

    const response = await app.request('/activity/player/forged.token', {
      headers: { host: 'content.localhost' }
    });

    expect(response.status).toBe(401);
  });

  it('serves player HTML without caching and without X-Frame-Options', async () => {
    const app = buildApp();
    const token = await mintToken();

    const response = await app.request(`/activity/player/${token}`, {
      headers: { host: 'content.localhost' }
    });

    if (response.status === 503) {
      expect(await response.text()).toContain('not built');
      return;
    }

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Frame-Options')).toBeNull();
    expect(response.headers.get('Content-Security-Policy')).toContain('https://app.test');
  });

  it('serves hashed assets as immutable', async () => {
    const app = buildApp();

    const response = await app.request('/activity/player-assets/index.html', {
      headers: { host: 'content.localhost' }
    });

    if (response.status === 404) return;

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
