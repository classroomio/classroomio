import { describe, expect, it } from 'vitest';
import { Hono } from '@api/utils/hono';
import { activityContentHostGate, isContentHostRequest } from '@api/middlewares/activity-content-host';

function buildApp() {
  return new Hono()
    .use('*', activityContentHostGate)
    .get('/course/123', (c) => c.json({ ok: true }))
    .get('/activity/content/token/sco.html', (c) => c.text('file'))
    .get('/activity/player/token', (c) => c.text('player'))
    .get('/activity/player-assets/app.js', (c) => c.text('asset'))
    .get('/activity/scorm/runtime/token/state', (c) => c.json({ ok: true }));
}

describe('activity content host gate', () => {
  it('lets app routes through on the app host', async () => {
    const response = await buildApp().request('/course/123', { headers: { host: 'app.test' } });

    expect(response.status).toBe(200);
  });

  it('returns 404 for app routes on the content host', async () => {
    const response = await buildApp().request('/course/123', { headers: { host: 'content.localhost' } });

    expect(response.status).toBe(404);
  });

  it('allows content, player and runtime paths on the content host', async () => {
    const app = buildApp();

    for (const path of [
      '/activity/content/token/sco.html',
      '/activity/player/token',
      '/activity/player-assets/app.js',
      '/activity/scorm/runtime/token/state'
    ]) {
      const response = await app.request(path, { headers: { host: 'content.localhost' } });

      expect(response.status).toBe(200);
    }
  });

  it('matches the cloud wildcard subdomain', async () => {
    const app = buildApp();

    const response = await app.request('/activity/content/token/sco.html', {
      headers: { host: 'k7f3q2.classroomio-content.com' }
    });

    expect(response.status).toBe(200);
  });

  it('prefers X-Forwarded-Host behind the Worker', async () => {
    const app = new Hono().use('*', async (c, next) => {
      c.header('x-host-kind', isContentHostRequest(c) ? 'content' : 'app');
      await next();
    });

    const contentResponse = await app.request('/', {
      headers: { host: 'upstream.test', 'x-forwarded-host': 'k7f3q2.classroomio-content.com' }
    });

    expect(contentResponse.headers.get('x-host-kind')).toBe('content');

    const appResponse = await app.request('/', { headers: { host: 'app.test' } });

    expect(appResponse.headers.get('x-host-kind')).toBe('app');
  });
});
