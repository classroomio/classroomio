import { describe, expect, it } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

import { publicApiScopesMiddleware } from './public-api-scopes';

const COHORT_SCOPES = ['cohort:read', 'cohort:write'];

function buildApp(scopes: string[]) {
  const v1Router = new Hono()
    .use('*', async (c: Context, next: Next) => {
      c.set('automationKey', { id: 'key-id', organizationId: 'org-id', type: 'mcp', scopes } as never);
      await next();
    })
    .use('*', publicApiScopesMiddleware)
    .get('/cohorts', (c) => c.json({ success: true }))
    .post('/cohorts/:cohortId/invite', (c) => c.json({ success: true }, 201))
    .put('/courses/:courseId', (c) => c.json({ success: true }))
    .delete('/courses/:courseId', (c) => c.json({ success: true }))
    .get('/audience', (c) => c.json({ success: true }));

  return new Hono().route('/public-api/v1', v1Router);
}

describe('publicApiScopesMiddleware', () => {
  it('lets a key with the MCP default cohort scopes reach cohort reads and writes', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/cohorts')).status).toBe(200);
    expect((await app.request('/public-api/v1/cohorts/c1/invite', { method: 'POST' })).status).toBe(201);
  });

  it('keeps cohort-scoped keys out of course update/delete and every other public API route', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1', { method: 'DELETE' })).status).toBe(403);
    expect((await app.request('/public-api/v1/audience')).status).toBe(403);
  });

  it('needs cohort:write for cohort writes', async () => {
    const app = buildApp(['cohort:read']);

    expect((await app.request('/public-api/v1/cohorts')).status).toBe(200);
    expect((await app.request('/public-api/v1/cohorts/c1/invite', { method: 'POST' })).status).toBe(403);
  });

  it('still lets a public_api:* key (API and Zapier keys) reach every route', async () => {
    const app = buildApp(['public_api:*']);

    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(200);
    expect((await app.request('/public-api/v1/cohorts/c1/invite', { method: 'POST' })).status).toBe(201);
  });
});
