import { describe, expect, it } from 'vitest';
import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';

import { publicApiScopesMiddleware } from './public-api-scopes';

const COHORT_SCOPES = ['cohort:read', 'cohort:write'];
const MEDIA_SCOPES = ['media:write'];

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
    .get('/audience', (c) => c.json({ success: true }))
    .get('/analytics/academy', (c) => c.json({ success: true }))
    .post('/analytics/academy', (c) => c.json({ success: true }))
    .get('/analytics/academy/catalog', (c) => c.json({ success: true }))
    .post('/analytics/academy/query', (c) => c.json({ success: true }))
    .get('/analytics/academy/students', (c) => c.json({ success: true }))
    .get('/analytics/marketing', (c) => c.json({ success: true }))
    .get('/analytics/marketing/courses/:courseId', (c) => c.json({ success: true }))
    .get('/analytics/compliance', (c) => c.json({ success: true }))
    .get('/analytics/compliance/students', (c) => c.json({ success: true }))
    .get('/organization/overview', (c) => c.json({ success: true }))
    .get('/organization', (c) => c.json({ success: true }))
    .get('/audience/:profileId/analytics', (c) => c.json({ success: true }))
    .get('/audience/:memberId', (c) => c.json({ success: true }))
    .get('/cohorts/:cohortId/analytics', (c) => c.json({ success: true }))
    .get('/cohorts/:cohortId/analytics/students', (c) => c.json({ success: true }))
    .get('/courses/:courseId/analytics', (c) => c.json({ success: true }))
    .get('/courses/:courseId/analytics/students', (c) => c.json({ success: true }))
    .get('/courses/:courseId/students', (c) => c.json({ success: true }))
    .put('/courses/:courseId/members/:memberId/lessons/:lessonId/completion', (c) => c.json({ success: true }))
    .post('/courses/:courseId/members/:memberId/exercises/:exerciseId/submissions', (c) =>
      c.json({ success: true }, 201)
    )
    .put('/courses/:courseId/members/:memberId', (c) => c.json({ success: true }))
    .get('/courses/:courseId', (c) => c.json({ success: true }))
    .get('/courses', (c) => c.json({ success: true }))
    .post('/courses', (c) => c.json({ success: true }, 201))
    .post('/assets', (c) => c.json({ success: true }, 201))
    .get('/assets', (c) => c.json({ success: true }))
    .get('/tags', (c) => c.json({ success: true }))
    .post('/tags', (c) => c.json({ success: true }, 201))
    .put('/tags/groups/:groupId', (c) => c.json({ success: true }))
    .put('/courses/:courseId/members/:memberId', (c) => c.json({ success: true }));

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

  it('lets analytics:read reach only analytics GETs', async () => {
    const app = buildApp(['analytics:read']);
    const reads = [
      '/public-api/v1/analytics/academy',
      '/public-api/v1/analytics/academy/catalog',
      '/public-api/v1/analytics/academy/students',
      '/public-api/v1/analytics/marketing',
      '/public-api/v1/analytics/marketing/courses/c1',
      '/public-api/v1/analytics/compliance',
      '/public-api/v1/analytics/compliance/students',
      '/public-api/v1/courses/c1/analytics',
      '/public-api/v1/courses/c1/analytics/students',
      '/public-api/v1/cohorts/c1/analytics',
      '/public-api/v1/cohorts/c1/analytics/students',
      '/public-api/v1/organization/overview',
      '/public-api/v1/audience/p1/analytics'
    ];

    for (const path of reads) {
      expect((await app.request(path)).status, path).toBe(200);
    }

    expect((await app.request('/public-api/v1/courses/c1/students')).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1')).status).toBe(403);
    expect((await app.request('/public-api/v1/cohorts')).status).toBe(403);
    expect((await app.request('/public-api/v1/organization')).status).toBe(403);
    expect((await app.request('/public-api/v1/audience/7')).status).toBe(403);
  });

  it('maps the cohort analytics, organization overview and audience analytics to analytics:read, not their family scope', async () => {
    const cohortKey = buildApp(COHORT_SCOPES);
    const organizationKey = buildApp(['organization:read']);
    const audienceKey = buildApp(['audience:read']);

    expect((await cohortKey.request('/public-api/v1/cohorts/c1/analytics')).status).toBe(403);
    expect((await cohortKey.request('/public-api/v1/cohorts/c1/analytics/students')).status).toBe(403);
    expect((await organizationKey.request('/public-api/v1/organization/overview')).status).toBe(403);
    expect((await organizationKey.request('/public-api/v1/organization')).status).toBe(200);
    expect((await audienceKey.request('/public-api/v1/audience/p1/analytics')).status).toBe(403);
    expect((await audienceKey.request('/public-api/v1/audience/7')).status).toBe(200);
  });

  it('maps the academy query POST to analytics:read, before the generic analytics rule', async () => {
    const app = buildApp(['analytics:read']);

    expect((await app.request('/public-api/v1/analytics/academy/query', { method: 'POST' })).status).toBe(200);
  });

  it('keeps the academy query POST out of keys without analytics:read', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/analytics/academy/query', { method: 'POST' })).status).toBe(403);
  });

  it('still refuses every analytics POST that is not the academy query', async () => {
    const app = buildApp(['analytics:read']);

    expect((await app.request('/public-api/v1/analytics/academy', { method: 'POST' })).status).toBe(403);
    expect((await app.request('/public-api/v1/analytics/academy/catalog', { method: 'POST' })).status).toBe(403);
    expect((await app.request('/public-api/v1/analytics/academy/students', { method: 'POST' })).status).toBe(403);
    expect((await app.request('/public-api/v1/analytics/marketing', { method: 'POST' })).status).toBe(403);
    expect((await app.request('/public-api/v1/analytics/compliance', { method: 'POST' })).status).toBe(403);
  });

  it('keeps cohort-scoped keys out of analytics', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/analytics/academy')).status).toBe(403);
    expect((await app.request('/public-api/v1/analytics/marketing')).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1/analytics')).status).toBe(403);
  });

  it('still lets a public_api:* key (API and Zapier keys) reach every route', async () => {
    const app = buildApp(['public_api:*']);

    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(200);
    expect((await app.request('/public-api/v1/cohorts/c1/invite', { method: 'POST' })).status).toBe(201);
    expect(
      (await app.request('/public-api/v1/courses/c1/members/m1/lessons/l1/completion', { method: 'PUT' })).status
    ).toBe(200);
  });

  const LESSON_COMPLETION = '/public-api/v1/courses/c1/members/m1/lessons/l1/completion';
  const EXERCISE_SUBMISSIONS = '/public-api/v1/courses/c1/members/m1/exercises/e1/submissions';

  it('lets course:student:write reach only the student routes', async () => {
    const app = buildApp(['course:student:write']);

    expect((await app.request(LESSON_COMPLETION, { method: 'PUT' })).status).toBe(200);
    expect((await app.request(EXERCISE_SUBMISSIONS, { method: 'POST' })).status).toBe(201);
    expect((await app.request('/public-api/v1/courses/c1/members/m1', { method: 'PUT' })).status).toBe(403);
  });

  it.each([['course:member:write'], ['course:submission:write']])(
    'keeps a %s key out of the student routes',
    async (scope) => {
      const app = buildApp([scope]);

      expect((await app.request(LESSON_COMPLETION, { method: 'PUT' })).status).toBe(403);
      expect((await app.request(EXERCISE_SUBMISSIONS, { method: 'POST' })).status).toBe(403);
    }
  );

  it('still lets course:member:write update a member', async () => {
    const app = buildApp(['course:member:write']);

    expect((await app.request('/public-api/v1/courses/c1/members/m1', { method: 'PUT' })).status).toBe(200);
  });

  it('lets a media:write key create an asset upload', async () => {
    const app = buildApp(MEDIA_SCOPES);

    expect((await app.request('/public-api/v1/assets', { method: 'POST' })).status).toBe(201);
  });

  it('refuses asset reads, because no read route or scope exists on that family yet', async () => {
    const app = buildApp(MEDIA_SCOPES);

    expect((await app.request('/public-api/v1/assets')).status).toBe(403);
  });

  it('keeps a media:write key out of every other public API route', async () => {
    const app = buildApp(MEDIA_SCOPES);

    expect((await app.request('/public-api/v1/cohorts')).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(403);
    expect((await app.request('/public-api/v1/audience')).status).toBe(403);
  });

  it('does not let a cohort-scoped key create an asset upload', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/assets', { method: 'POST' })).status).toBe(403);
  });

  it('lets course:read list courses but not create one', async () => {
    const app = buildApp(['course:read']);

    expect((await app.request('/public-api/v1/courses')).status).toBe(200);
    expect((await app.request('/public-api/v1/courses', { method: 'POST' })).status).toBe(403);
  });

  it('keeps a key without course:read out of the course list', async () => {
    const app = buildApp(COHORT_SCOPES);

    expect((await app.request('/public-api/v1/courses')).status).toBe(403);
  });

  it('lets course:read list tags but not write them', async () => {
    const app = buildApp(['course:read']);

    expect((await app.request('/public-api/v1/tags')).status).toBe(200);
    expect((await app.request('/public-api/v1/tags', { method: 'POST' })).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(403);
  });

  it('lets course:tag:write write tags and reach course update, but not course read, delete or members', async () => {
    const app = buildApp(['course:tag:write']);

    expect((await app.request('/public-api/v1/tags', { method: 'POST' })).status).toBe(201);
    expect((await app.request('/public-api/v1/tags/groups/g1', { method: 'PUT' })).status).toBe(200);
    expect((await app.request('/public-api/v1/courses/c1', { method: 'PUT' })).status).toBe(200);
    expect((await app.request('/public-api/v1/courses/c1')).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1', { method: 'DELETE' })).status).toBe(403);
    expect((await app.request('/public-api/v1/courses/c1/members/m1', { method: 'PUT' })).status).toBe(403);
  });

  it('lets a public_api:* key create an asset upload', async () => {
    const app = buildApp(['public_api:*']);

    expect((await app.request('/public-api/v1/assets', { method: 'POST' })).status).toBe(201);
  });
});
