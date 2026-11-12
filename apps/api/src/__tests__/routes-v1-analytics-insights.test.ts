import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/analytics/insights', () => ({
  getPublicApiInsightsCatalogService: vi.fn(),
  queryPublicApiInsightsService: vi.fn(),
  getPublicApiInsightsSnapshotService: vi.fn(),
  listPublicApiInsightsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/analytics/org', () => ({
  getPublicApiOrgAnalyticsService: vi.fn(),
  listPublicApiComplianceLearnersService: vi.fn()
}));

vi.mock('@api/services/v1/analytics/course', () => ({
  getPublicApiCourseAnalyticsService: vi.fn(),
  listPublicApiCourseAnalyticsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/analytics/learner', () => ({
  getPublicApiLearnerAnalyticsService: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import {
  getPublicApiInsightsCatalogService,
  getPublicApiInsightsSnapshotService,
  listPublicApiInsightsStudentsService,
  queryPublicApiInsightsService
} from '@api/services/v1/analytics/insights';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';

const QUERY_RESULT = {
  columns: [{ key: 'rows__count', role: 'measure' as const, valueType: 'integer' as const }],
  rows: [{ rows__count: 42 }],
  total: 1,
  range: '7d' as const,
  generatedAt: '2026-11-05T10:00:00.000Z',
  cached: false,
  refreshThrottled: false
};

const SNAPSHOT = {
  scope: {
    type: 'cohort' as const,
    id: COHORT_ID,
    name: 'Cohort',
    description: null,
    studentCount: 3,
    pendingCount: 0,
    cohortCount: 1,
    activeCohortCount: 1,
    studentTarget: null,
    seatsUsed: null,
    seatsNotJoined: null,
    courses: []
  },
  selection: { courseId: null, exerciseId: null, breakdown: 'core' as const, range: 'all' as const },
  generatedAt: '2026-11-05T10:00:00.000Z',
  widgets: []
};

const STUDENT_PAGE = {
  items: [
    {
      id: ORG_ID,
      name: 'Ana',
      email: 'ana@test.dev',
      avatarUrl: null,
      progressPct: 60,
      avgScorePct: 80,
      coursesCompleted: 1,
      coursesTotal: 2,
      videoPct: 90,
      attendancePct: null,
      certificates: 0,
      lastLoginAt: '2026-11-05 09:30:00',
      isOverdue: false,
      status: 'on_track' as const,
      nowAt: 'Lesson 2'
    }
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
};

const ctxMiddleware = async (c: Context, next: Next) => {
  c.set('orgId' as never, 'org-1');
  c.set('actorId' as never, 'actor-1');
  c.set('automationKey' as never, { id: 'key-id', organizationId: 'org-1', type: 'mcp', scopes: ['analytics:read'] });
  await next();
};

// The same two-level mount v1/index.ts uses, so the test hits the composed analytics router
// with the insights router ordered ahead of the catch-all org analytics router.
const app = new Hono().route(
  '/public-api/v1',
  new Hono().use('*', ctxMiddleware).route('/analytics', v1AnalyticsRouter)
);

const specBody = {
  scope: { type: 'cohort', id: COHORT_ID },
  spec: {
    source: 'student',
    measures: [{ metric: 'rows', agg: 'value' }],
    dimensions: [],
    filters: [],
    sort: [],
    limit: 25,
    page: 1,
    range: 'all'
  }
};

describe('GET /analytics/insights/catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the catalog with a no-store cache header', async () => {
    vi.mocked(getPublicApiInsightsCatalogService).mockResolvedValue({ sources: {}, widgets: {} } as never);

    const response = await app.request('/public-api/v1/analytics/insights/catalog');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: { sources: {}, widgets: {} } });
    expect(getPublicApiInsightsCatalogService).toHaveBeenCalledWith('org-1', 'actor-1');
  });

  it('maps the org-team rejection to 403', async () => {
    vi.mocked(getPublicApiInsightsCatalogService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    expect((await app.request('/public-api/v1/analytics/insights/catalog')).status).toBe(403);
  });
});

describe('POST /analytics/insights/query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the query and returns its data plus meta with the effective range', async () => {
    vi.mocked(queryPublicApiInsightsService).mockResolvedValue(QUERY_RESULT as never);

    const response = await app.request('/public-api/v1/analytics/insights/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(specBody)
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(body).toEqual({
      success: true,
      data: { columns: QUERY_RESULT.columns, rows: QUERY_RESULT.rows },
      meta: { generatedAt: QUERY_RESULT.generatedAt, cached: false, range: '7d' },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 }
    });
    expect(queryPublicApiInsightsService).toHaveBeenCalledWith('org-1', 'actor-1', specBody);
  });

  it.each([
    [
      'placeholder value',
      { ...specBody, spec: { ...specBody.spec, filters: [{ field: 'course', op: 'eq', value: '$course' }] } }
    ],
    [
      'in over 100 ids',
      {
        ...specBody,
        spec: {
          ...specBody.spec,
          filters: [
            {
              field: 'course',
              op: 'in',
              value: Array.from({ length: 101 }, () => '33333333-3333-4333-8333-333333333333')
            }
          ]
        }
      }
    ],
    ['limit over 1000', { ...specBody, spec: { ...specBody.spec, limit: 1001 } }],
    ['page over 4000', { ...specBody, spec: { ...specBody.spec, page: 4001 } }],
    ['no measures', { ...specBody, spec: { ...specBody.spec, measures: [] } }],
    ['bad scope uuid', { ...specBody, scope: { type: 'cohort', id: 'nope' } }]
  ])('rejects %s with 400', async (_name, body) => {
    const response = await app.request('/public-api/v1/analytics/insights/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    expect(response.status).toBe(400);
    expect(queryPublicApiInsightsService).not.toHaveBeenCalled();
  });

  it('maps a scope not in the organization to 404', async () => {
    vi.mocked(queryPublicApiInsightsService).mockRejectedValue(
      new AppError('Analytics scope not found', ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, 404)
    );

    expect(
      (
        await app.request('/public-api/v1/analytics/insights/query', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(specBody)
        })
      ).status
    ).toBe(404);
  });
});

describe('GET /analytics/insights/dashboards/:scopeType/:scopeId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the snapshot with its selection passthrough', async () => {
    vi.mocked(getPublicApiInsightsSnapshotService).mockResolvedValue(SNAPSHOT as never);

    const response = await app.request(
      `/public-api/v1/analytics/insights/dashboards/cohort/${COHORT_ID}?range=30d&breakdown=cohorts&courseId=${ORG_ID}`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: SNAPSHOT });
    expect(getPublicApiInsightsSnapshotService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      {
        scopeType: 'cohort',
        scopeId: COHORT_ID
      },
      { courseId: ORG_ID, range: '30d', breakdown: 'cohorts' }
    );
  });

  it.each([
    ['bad scope uuid', `/analytics/insights/dashboards/cohort/nope`],
    ['bad scope type', `/analytics/insights/dashboards/team/${COHORT_ID}`],
    ['dashboard-internal breakdown', `/analytics/insights/dashboards/cohort/${COHORT_ID}?breakdown=core`],
    ['bad range', `/analytics/insights/dashboards/cohort/${COHORT_ID}?range=14d`]
  ])('rejects %s with 400', async (_name, path) => {
    const response = await app.request(`/public-api/v1${path}`);

    expect(response.status).toBe(400);
    expect(getPublicApiInsightsSnapshotService).not.toHaveBeenCalled();
  });
});

describe('GET /analytics/insights/students', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists students with their pagination passthrough', async () => {
    vi.mocked(listPublicApiInsightsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    const response = await app.request(
      `/public-api/v1/analytics/insights/students?scopeType=cohort&scopeId=${COHORT_ID}&page=1&limit=20&search=ana&status=at_risk&isOverdue=true&sort=lastLogin&dir=desc`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({
      success: true,
      data: STUDENT_PAGE.items,
      pagination: STUDENT_PAGE.pagination
    });
    expect(listPublicApiInsightsStudentsService).toHaveBeenCalledWith('org-1', 'actor-1', {
      page: 1,
      limit: 20,
      scopeType: 'cohort',
      scopeId: COHORT_ID,
      search: 'ana',
      status: 'at_risk',
      isOverdue: true,
      sort: 'lastLogin',
      dir: 'desc'
    });
  });

  it('parses isOverdue=false', async () => {
    vi.mocked(listPublicApiInsightsStudentsService).mockResolvedValue({
      items: [],
      pagination: STUDENT_PAGE.pagination
    } as never);

    await app.request(
      `/public-api/v1/analytics/insights/students?scopeType=cohort&scopeId=${COHORT_ID}&isOverdue=false`
    );

    expect(listPublicApiInsightsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      expect.objectContaining({ isOverdue: false })
    );
  });

  it.each([
    ['missing scope', `/analytics/insights/students`],
    ['bad scope uuid', `/analytics/insights/students?scopeType=org&scopeId=nope`],
    ['limit over 100', `/analytics/insights/students?scopeType=org&scopeId=${COHORT_ID}&limit=101`],
    ['page over 4000', `/analytics/insights/students?scopeType=org&scopeId=${COHORT_ID}&page=4001`],
    [
      'page and limit past the offset cap',
      `/analytics/insights/students?scopeType=org&scopeId=${COHORT_ID}&page=1002&limit=100`
    ],
    ['bad sort', `/analytics/insights/students?scopeType=org&scopeId=${COHORT_ID}&sort=low_score`],
    ['bad status', `/analytics/insights/students?scopeType=org&scopeId=${COHORT_ID}&status=failing`]
  ])('rejects %s with 400', async (_name, path) => {
    const response = await app.request(`/public-api/v1${path}`);

    expect(response.status).toBe(400);
    expect(listPublicApiInsightsStudentsService).not.toHaveBeenCalled();
  });
});

describe('OpenAPI', () => {
  it('documents the insights routes with summaries, tags and status keys', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[]; responses: Record<string, unknown> }>>;
    };

    const catalog = spec.paths['/public-api/v1/analytics/insights/catalog'];
    const query = spec.paths['/public-api/v1/analytics/insights/query'];
    const snapshot = spec.paths['/public-api/v1/analytics/insights/dashboards/{scopeType}/{scopeId}'];
    const students = spec.paths['/public-api/v1/analytics/insights/students'];

    expect(catalog.get).toMatchObject({
      summary: 'List insights sources, metrics and filters',
      tags: ['Analytics Insights']
    });
    expect(query.post).toMatchObject({ summary: 'Run an insights query', tags: ['Analytics Insights'] });
    expect(snapshot.get).toMatchObject({ summary: 'Get an insights dashboard snapshot', tags: ['Analytics Insights'] });
    expect(students.get).toMatchObject({ summary: 'List students with their insights', tags: ['Analytics Insights'] });
    expect(Object.keys(query.post.responses).sort()).toEqual(['200', '400', '401', '403', '404', '429', '503']);
    expect(Object.keys(students.get.responses).sort()).toEqual(['200', '400', '401', '403', '404', '429']);
  });
});
