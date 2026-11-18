import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';

import { apiSecureHeadersMiddleware } from './secure-headers';

function buildApp() {
  return new Hono()
    .use('*', apiSecureHeadersMiddleware)
    .get('/api/auth/oauth2/authorize', (c) => c.redirect('/oauth/consent'))
    .get('/api/authors', (c) => c.json({ success: true }))
    .get('/docs', (c) => c.html('<p>docs</p>'));
}

describe('apiSecureHeadersMiddleware', () => {
  it('omits Cross-Origin-Opener-Policy on Better Auth routes so OAuth popups keep their opener', async () => {
    const response = await buildApp().request('/api/auth/oauth2/authorize');

    expect(response.status).toBe(302);
    expect(response.headers.get('cross-origin-opener-policy')).toBeNull();
    expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('keeps Cross-Origin-Opener-Policy on every other route', async () => {
    const app = buildApp();

    for (const path of ['/docs', '/api/authors']) {
      const response = await app.request(path);

      expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin');
      expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    }
  });
});
