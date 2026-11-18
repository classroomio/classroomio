import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { generateSpecs } from 'hono-openapi';
import { Hono } from '@api/utils/hono';

vi.mock('@api/middlewares/rate-limiter', () => ({
  createAuthenticationFailureRateLimiter: () => async (_c: Context, next: Next) => next(),
  createRateLimiter: () => async (_c: Context, next: Next) => next()
}));

vi.mock('@api/services/v1/analytics', () => ({
  getPublicApiAnalyticsCatalogService: vi.fn(),
  queryPublicApiAnalyticsService: vi.fn(),
  getPublicApiAnalyticsSnapshotService: vi.fn(),
  listPublicApiAnalyticsStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/marketing', () => ({
  getPublicApiMarketingAnalyticsService: vi.fn(),
  getPublicApiCourseMarketingService: vi.fn()
}));

vi.mock('@api/services/v1/compliance', () => ({
  getPublicApiComplianceAnalyticsService: vi.fn(),
  listPublicApiComplianceStudentsService: vi.fn()
}));

vi.mock('@api/services/v1/courses/course', () => ({
  createPublicApiCourseService: vi.fn(),
  deletePublicApiCourseService: vi.fn(),
  exportCourseService: vi.fn(),
  getCourseService: vi.fn(),
  listCoursesService: vi.fn(),
  listCourseStudentsService: vi.fn(),
  updatePublicApiCourseService: vi.fn(),
  updatePublicApiCourseStructureService: vi.fn()
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { enrichPublicApiOpenApiSpec } from '@cio/utils/openapi/public-api';
import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';
import {
  getPublicApiAnalyticsCatalogService,
  getPublicApiAnalyticsSnapshotService,
  listPublicApiAnalyticsStudentsService,
  queryPublicApiAnalyticsService
} from '@api/services/v1/analytics';
import { getCourseService } from '@api/services/v1/courses/course';
import { v1AnalyticsRouter } from '@api/routes/v1/analytics';
import { v1CohortAnalyticsRouter } from '@api/routes/v1/cohorts/analytics';
import { v1CoursesRouter } from '@api/routes/v1/courses';

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

const app = new Hono().route(
  '/public-api/v1',
  new Hono()
    .use('*', ctxMiddleware)
    .route('/analytics', v1AnalyticsRouter)
    .route('/courses', v1CoursesRouter)
    .route('/cohorts/:cohortId/analytics', v1CohortAnalyticsRouter)
);

const ORG_PAGE = '/public-api/v1/analytics/academy';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

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

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

describe(`GET ${ORG_ANALYTICS_PAGE.slug} catalog`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the catalog with a no-store cache header', async () => {
    vi.mocked(getPublicApiAnalyticsCatalogService).mockResolvedValue({ sources: {}, widgets: {} } as never);

    const response = await app.request(`${ORG_PAGE}/catalog`);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: { sources: {}, widgets: {} } });
    expect(getPublicApiAnalyticsCatalogService).toHaveBeenCalledWith('org-1', 'actor-1');
  });

  it('maps the org-team rejection to 403', async () => {
    vi.mocked(getPublicApiAnalyticsCatalogService).mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    expect((await app.request(`${ORG_PAGE}/catalog`)).status).toBe(403);
  });
});

describe(`POST ${ORG_ANALYTICS_PAGE.slug} query`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs the query and returns its data plus meta with the effective range', async () => {
    vi.mocked(queryPublicApiAnalyticsService).mockResolvedValue(QUERY_RESULT as never);

    const response = await post(`${ORG_PAGE}/query`, specBody);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(body).toEqual({
      success: true,
      data: { columns: QUERY_RESULT.columns, rows: QUERY_RESULT.rows },
      meta: { generatedAt: QUERY_RESULT.generatedAt, cached: false, range: '7d' },
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 }
    });
    expect(queryPublicApiAnalyticsService).toHaveBeenCalledWith('org-1', 'actor-1', specBody);
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
    ['bad scope uuid', { ...specBody, scope: { type: 'cohort', id: 'nope' } }],
    ['bad scope type', { ...specBody, scope: { type: 'team', id: COHORT_ID } }]
  ])('rejects %s with 400', async (_name, body) => {
    const response = await post(`${ORG_PAGE}/query`, body);

    expect(response.status).toBe(400);
    expect(queryPublicApiAnalyticsService).not.toHaveBeenCalled();
  });

  it('maps a scope not in the organization to 404', async () => {
    vi.mocked(queryPublicApiAnalyticsService).mockRejectedValue(
      new AppError('Analytics scope not found', ErrorCodes.ANALYTICS_SCOPE_NOT_FOUND, 404)
    );

    expect((await post(`${ORG_PAGE}/query`, specBody)).status).toBe(404);
  });
});

describe(`GET ${ORG_ANALYTICS_PAGE.slug} snapshot`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the organization snapshot, with the scope taken from the path organization', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockResolvedValue(SNAPSHOT as never);

    const response = await app.request(`${ORG_PAGE}?range=30d&breakdown=cohorts&courseId=${COURSE_ID}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: SNAPSHOT });
    expect(getPublicApiAnalyticsSnapshotService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'org', id: 'org-1' },
      { courseId: COURSE_ID, range: '30d', breakdown: 'cohorts' }
    );
  });

  it.each([
    ['dashboard-internal breakdown', '?breakdown=core'],
    ['bad range', '?range=14d'],
    ['bad courseId', '?courseId=nope']
  ])('rejects %s with 400', async (_name, query) => {
    const response = await app.request(`${ORG_PAGE}${query}`);

    expect(response.status).toBe(400);
    expect(getPublicApiAnalyticsSnapshotService).not.toHaveBeenCalled();
  });

  it('maps a forbidden actor to 403', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockRejectedValue(
      new AppError('You do not have access to these analytics', ErrorCodes.ANALYTICS_SCOPE_FORBIDDEN, 403)
    );

    expect((await app.request(ORG_PAGE)).status).toBe(403);
  });
});

describe(`GET ${ORG_ANALYTICS_PAGE.slug} students`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists organization students with their pagination passthrough', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    const response = await app.request(
      `${ORG_PAGE}/students?page=1&limit=20&search=ana&status=at_risk&isOverdue=true&sort=lastLogin&dir=desc&courseId=${COURSE_ID}`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({
      success: true,
      data: STUDENT_PAGE.items,
      pagination: STUDENT_PAGE.pagination
    });
    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'org', id: 'org-1' },
      {
        page: 1,
        limit: 20,
        courseId: COURSE_ID,
        search: 'ana',
        status: 'at_risk',
        isOverdue: true,
        sort: 'lastLogin',
        dir: 'desc'
      }
    );
  });

  it('parses isOverdue=false', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue({
      items: [],
      pagination: STUDENT_PAGE.pagination
    } as never);

    await app.request(`${ORG_PAGE}/students?isOverdue=false`);

    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'org', id: 'org-1' },
      expect.objectContaining({ isOverdue: false })
    );
  });

  it.each([
    ['limit over 100', '?limit=101'],
    ['page over 4000', '?page=4001'],
    ['page and limit past the offset cap', '?page=1002&limit=100'],
    ['bad sort', '?sort=low_score'],
    ['bad status', '?status=failing']
  ])('rejects %s with 400', async (_name, query) => {
    const response = await app.request(`${ORG_PAGE}/students${query}`);

    expect(response.status).toBe(400);
    expect(listPublicApiAnalyticsStudentsService).not.toHaveBeenCalled();
  });

  it('ignores a scopeType and scopeId in the query: the scope comes from the path', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    await app.request(`${ORG_PAGE}/students?scopeType=cohort&scopeId=${COHORT_ID}`);

    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'org', id: 'org-1' },
      expect.not.objectContaining({ scopeType: 'cohort' })
    );
  });
});

describe('GET /courses/:courseId/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to the course snapshot, not the course detail handler, with the course scope', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockResolvedValue(SNAPSHOT as never);

    const response = await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics?range=7d&exerciseId=${ORG_ID}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: SNAPSHOT });
    expect(getPublicApiAnalyticsSnapshotService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'course', id: COURSE_ID },
      { range: '7d', exerciseId: ORG_ID }
    );
    expect(getCourseService).not.toHaveBeenCalled();
  });

  it('ignores a courseId query because the course comes from the path', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockResolvedValue(SNAPSHOT as never);

    await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics?courseId=${ORG_ID}`);

    expect(getPublicApiAnalyticsSnapshotService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'course', id: COURSE_ID },
      {}
    );
  });

  it.each([
    ['a non-uuid courseId', '/courses/nope/analytics'],
    ['a bad range', `/courses/${COURSE_ID}/analytics?range=14d`]
  ])('rejects %s with 400', async (_name, path) => {
    const response = await app.request(`/public-api/v1${path}`);

    expect(response.status).toBe(400);
    expect(getPublicApiAnalyticsSnapshotService).not.toHaveBeenCalled();
  });

  it('maps a course outside the organization to 404', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockRejectedValue(
      new AppError('Analytics scope not found', ErrorCodes.ANALYTICS_SCOPE_NOT_FOUND, 404)
    );

    expect((await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics`)).status).toBe(404);
  });

  it('lists the course students with the course scope and caps limit at 100', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    const response = await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics/students?page=1&limit=20`);
    const tooMany = await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics/students?limit=101`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: STUDENT_PAGE.items,
      pagination: STUDENT_PAGE.pagination
    });
    expect(tooMany.status).toBe(400);
    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledTimes(1);
    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'course', id: COURSE_ID },
      expect.objectContaining({ page: 1, limit: 20, sort: 'status' })
    );
  });

  it('does not accept a courseId filter on the course students', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    await app.request(`/public-api/v1/courses/${COURSE_ID}/analytics/students?courseId=${ORG_ID}`);

    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'course', id: COURSE_ID },
      expect.not.objectContaining({ courseId: ORG_ID })
    );
  });
});

describe('GET /cohorts/:cohortId/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the cohort snapshot with its selection passthrough and the cohort scope', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockResolvedValue(SNAPSHOT as never);

    const response = await app.request(
      `/public-api/v1/cohorts/${COHORT_ID}/analytics?range=30d&breakdown=courses&courseId=${COURSE_ID}`
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: SNAPSHOT });
    expect(getPublicApiAnalyticsSnapshotService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'cohort', id: COHORT_ID },
      { courseId: COURSE_ID, range: '30d', breakdown: 'courses' }
    );
  });

  it.each([
    ['a non-uuid cohortId', '/cohorts/nope/analytics'],
    ['a dashboard-internal breakdown', `/cohorts/${COHORT_ID}/analytics?breakdown=core`],
    ['a bad range', `/cohorts/${COHORT_ID}/analytics?range=14d`]
  ])('rejects %s with 400', async (_name, path) => {
    const response = await app.request(`/public-api/v1${path}`);

    expect(response.status).toBe(400);
    expect(getPublicApiAnalyticsSnapshotService).not.toHaveBeenCalled();
  });

  it('maps a cohort outside the organization to 404', async () => {
    vi.mocked(getPublicApiAnalyticsSnapshotService).mockRejectedValue(
      new AppError('Analytics scope not found', ErrorCodes.ANALYTICS_SCOPE_NOT_FOUND, 404)
    );

    expect((await app.request(`/public-api/v1/cohorts/${COHORT_ID}/analytics`)).status).toBe(404);
  });

  it('lists the cohort students with the cohort scope', async () => {
    vi.mocked(listPublicApiAnalyticsStudentsService).mockResolvedValue(STUDENT_PAGE as never);

    const response = await app.request(
      `/public-api/v1/cohorts/${COHORT_ID}/analytics/students?page=1&limit=20&status=at_risk&isOverdue=true`
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: STUDENT_PAGE.items,
      pagination: STUDENT_PAGE.pagination
    });
    expect(listPublicApiAnalyticsStudentsService).toHaveBeenCalledWith(
      'org-1',
      'actor-1',
      { type: 'cohort', id: COHORT_ID },
      expect.objectContaining({ page: 1, limit: 20, status: 'at_risk', isOverdue: true })
    );
  });

  it('rejects a bad sort on the cohort students with 400', async () => {
    const response = await app.request(`/public-api/v1/cohorts/${COHORT_ID}/analytics/students?sort=low_score`);

    expect(response.status).toBe(400);
    expect(listPublicApiAnalyticsStudentsService).not.toHaveBeenCalled();
  });
});

describe('OpenAPI', () => {
  it('documents the analytics routes with summaries, tags and status keys', async () => {
    const spec = enrichPublicApiOpenApiSpec((await generateSpecs(app)) as never) as {
      paths: Record<string, Record<string, { summary?: string; tags?: string[]; responses: Record<string, unknown> }>>;
    };
    const label = ORG_ANALYTICS_PAGE.label;
    const tags = [label];

    const snapshot = spec.paths[ORG_PAGE];
    const students = spec.paths[`${ORG_PAGE}/students`];
    const catalog = spec.paths[`${ORG_PAGE}/catalog`];
    const query = spec.paths[`${ORG_PAGE}/query`];
    const courseSnapshot = spec.paths['/public-api/v1/courses/{courseId}/analytics'];
    const cohortSnapshot = spec.paths['/public-api/v1/cohorts/{cohortId}/analytics'];

    expect(snapshot.get).toMatchObject({ summary: `Get the ${label} dashboard for the organization`, tags });
    expect(students.get).toMatchObject({ summary: `List students on the ${label} page`, tags });
    expect(catalog.get).toMatchObject({ summary: `List ${label} sources, metrics and filters`, tags });
    expect(query.post).toMatchObject({ summary: `Query ${label} analytics`, tags });
    expect(courseSnapshot.get).toMatchObject({ summary: "Get a course's analytics", tags });
    expect(cohortSnapshot.get).toMatchObject({ summary: "Get a cohort's analytics", tags });
    expect(Object.keys(query.post.responses).sort()).toEqual(['200', '400', '401', '403', '404', '429', '503']);
    expect(Object.keys(students.get.responses).sort()).toEqual(['200', '400', '401', '403', '429']);
    expect(Object.keys(cohortSnapshot.get.responses).sort()).toEqual(['200', '400', '401', '403', '404', '429', '503']);
  });
});
