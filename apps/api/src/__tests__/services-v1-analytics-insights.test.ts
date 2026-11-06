import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertAutomationActor: vi.fn(),
  assertOrgTeamMember: vi.fn(),
  toPublicApiPagination: vi.fn((page: number, limit: number, total: number) => ({
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit)
  })),
  describeInsightsRegistry: vi.fn(),
  runInsightsQueryForActor: vi.fn(),
  runInsightsQueryForScope: vi.fn(),
  getInsightsDashboardSnapshotForActor: vi.fn(),
  listInsightsStudentsForActor: vi.fn(),
  resolveInsightsActorForCreator: vi.fn()
}));

vi.mock('@api/services/v1/shared', () => ({
  assertAutomationActor: mocks.assertAutomationActor,
  assertOrgTeamMember: mocks.assertOrgTeamMember,
  toPublicApiPagination: mocks.toPublicApiPagination
}));

vi.mock('@cio/db/queries/insights', () => ({
  describeInsightsRegistry: mocks.describeInsightsRegistry
}));

vi.mock('@api/services/insights', () => ({
  runInsightsQueryForActor: mocks.runInsightsQueryForActor,
  getInsightsDashboardSnapshotForActor: mocks.getInsightsDashboardSnapshotForActor,
  listInsightsStudentsForActor: mocks.listInsightsStudentsForActor,
  resolveInsightsActorForCreator: mocks.resolveInsightsActorForCreator
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getPublicApiInsightsCatalogService,
  getPublicApiInsightsSnapshotService,
  listPublicApiInsightsStudentsService,
  queryPublicApiInsightsService
} from '@api/services/v1/analytics/insights';
import {
  INSIGHTS_DIMENSION_DESCRIPTIONS,
  INSIGHTS_FILTER_DESCRIPTIONS,
  INSIGHTS_SOURCE_DESCRIPTIONS,
  INSIGHTS_WIDGET_DESCRIPTIONS
} from '@cio/utils/constants/insights-catalog';
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const PROFILE_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_COURSE_ID = '44444444-4444-4444-8444-444444444444';

const ACTOR = { profileId: PROFILE_ID, orgId: ORG_ID, orgRoles: { [ORG_ID]: 2 } };

const QUERY_REQUEST = {
  scope: { type: 'cohort' as const, id: COHORT_ID },
  spec: {
    source: 'student' as const,
    measures: [{ metric: 'rows' as const, agg: 'value' as const }],
    dimensions: [],
    filters: [],
    sort: [],
    limit: 25,
    page: 1,
    range: 'all' as const
  }
};

const QUERY_RESULT = {
  columns: [{ key: 'rows__count', role: 'measure' as const, valueType: 'integer' as const }],
  rows: [{ rows__count: 7 }],
  total: 1,
  range: '7d' as const,
  generatedAt: '2026-11-05T10:00:00.000Z',
  cached: false,
  refreshThrottled: true
};

function orgTeamMemberForbidden(): void {
  throw new AppError(
    'Automation actor must be an organization admin or tutor',
    ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
    403
  );
}

function actorForbidden(): void {
  throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
}

describe('getPublicApiInsightsCatalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertOrgTeamMember.mockResolvedValue(1);
  });

  it('merges the compiled registry with the catalog documentation', async () => {
    mocks.describeInsightsRegistry.mockReturnValue({
      student: {
        id: 'student',
        scopeTypes: ['cohort', 'course', 'org'],
        dimensions: { student: { valueType: 'id', hasLabel: true, hasRank: true } },
        metrics: { rows: { valueType: 'integer', aggs: ['value'] } },
        filters: {
          course: { kind: 'pushdown', valueType: 'id', ops: ['in'] },
          status: { kind: 'predicate', valueType: 'text', ops: ['eq'] }
        },
        hasSearch: true
      }
    });

    const catalog = await getPublicApiInsightsCatalogService(ORG_ID, PROFILE_ID);

    expect(mocks.assertOrgTeamMember).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(catalog.widgets).toBe(INSIGHTS_WIDGET_DESCRIPTIONS);
    expect(catalog.sources.student).toEqual({
      id: 'student',
      description: INSIGHTS_SOURCE_DESCRIPTIONS.student,
      scopeTypes: ['cohort', 'course', 'org'],
      hasSearch: true,
      dimensions: {
        student: {
          valueType: 'id',
          hasLabel: true,
          hasRank: true,
          description: INSIGHTS_DIMENSION_DESCRIPTIONS.student
        }
      },
      metrics: {
        rows: {
          valueType: 'integer',
          aggs: ['value'],
          description: 'The number of rows in the working group, the row count used for counts and shares.'
        }
      },
      filters: {
        course: {
          kind: 'pushdown',
          valueType: 'id',
          ops: ['in'],
          description: INSIGHTS_FILTER_DESCRIPTIONS.course
        },
        status: {
          kind: 'predicate',
          valueType: 'text',
          ops: ['eq'],
          description: INSIGHTS_FILTER_DESCRIPTIONS.status
        }
      }
    });
  });

  it('refuses a non org-team key creator with 403 before reading the registry', async () => {
    mocks.assertOrgTeamMember.mockRejectedValue(
      new AppError('Automation actor must be an organization admin or tutor', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403)
    );

    await expect(getPublicApiInsightsCatalogService(ORG_ID, PROFILE_ID)).rejects.toMatchObject({
      code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      statusCode: 403
    });

    expect(mocks.describeInsightsRegistry).not.toHaveBeenCalled();
  });
});

describe('queryPublicApiInsightsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAutomationActor.mockReturnValue(undefined);
    mocks.resolveInsightsActorForCreator.mockResolvedValue(ACTOR);
    mocks.runInsightsQueryForActor.mockResolvedValue(QUERY_RESULT);
  });

  it('delegates the request for the live-role actor and returns the part-A result', async () => {
    const result = await queryPublicApiInsightsService(ORG_ID, PROFILE_ID, QUERY_REQUEST);

    expect(mocks.resolveInsightsActorForCreator).toHaveBeenCalledWith(ORG_ID, PROFILE_ID);
    expect(mocks.runInsightsQueryForActor).toHaveBeenCalledWith(ACTOR, QUERY_REQUEST);
    expect(result).toBe(QUERY_RESULT);
    expect(result.refreshThrottled).toBe(true);
    expect(result.range).toBe('7d');
  });

  it('rejects without an actor id before reading the live role', async () => {
    mocks.assertAutomationActor.mockImplementation(actorForbidden);

    await expect(queryPublicApiInsightsService(ORG_ID, null, QUERY_REQUEST)).rejects.toMatchObject({
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401
    });

    expect(mocks.resolveInsightsActorForCreator).not.toHaveBeenCalled();
  });

  it('rejects 401 when the key creator lost their org membership', async () => {
    mocks.resolveInsightsActorForCreator.mockRejectedValue(
      new AppError('You are no longer a member of this organization', ErrorCodes.UNAUTHORIZED, 401)
    );

    await expect(queryPublicApiInsightsService(ORG_ID, PROFILE_ID, QUERY_REQUEST)).rejects.toMatchObject({
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 401
    });

    expect(mocks.runInsightsQueryForActor).not.toHaveBeenCalled();
  });

  it('uses the demoted actor state between two calls, one denied one allowed', async () => {
    mocks.resolveInsightsActorForCreator
      .mockResolvedValueOnce(ACTOR)
      .mockRejectedValueOnce(
        new AppError('You are no longer a member of this organization', ErrorCodes.UNAUTHORIZED, 401)
      );

    await expect(queryPublicApiInsightsService(ORG_ID, PROFILE_ID, QUERY_REQUEST)).resolves.toBe(QUERY_RESULT);
    await expect(queryPublicApiInsightsService(ORG_ID, PROFILE_ID, QUERY_REQUEST)).rejects.toMatchObject({
      statusCode: 401
    });

    expect(mocks.runInsightsQueryForActor).toHaveBeenCalledTimes(1);
  });
});

describe('getPublicApiInsightsSnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAutomationActor.mockReturnValue(undefined);
    mocks.resolveInsightsActorForCreator.mockResolvedValue(ACTOR);
    mocks.getInsightsDashboardSnapshotForActor.mockResolvedValue({
      scope: { type: 'cohort', id: COHORT_ID, orgId: ORG_ID },
      selection: { courseId: null, exerciseId: null, breakdown: 'core' as const, range: 'all' as const },
      generatedAt: '2026-11-05T10:00:00.000Z',
      widgets: []
    });
  });

  it('authorizes once and delegates the scope and the selection', async () => {
    const query = {
      courseId: OTHER_COURSE_ID,
      exerciseId: undefined,
      breakdown: 'cohorts' as const,
      range: '30d' as const
    };

    await getPublicApiInsightsSnapshotService(ORG_ID, PROFILE_ID, { scopeType: 'cohort', scopeId: COHORT_ID }, query);

    expect(mocks.getInsightsDashboardSnapshotForActor).toHaveBeenCalledWith(
      ACTOR,
      { type: 'cohort', id: COHORT_ID },
      query
    );
  });

  it('rejects 401 when the creator lost their membership', async () => {
    mocks.resolveInsightsActorForCreator.mockRejectedValue(
      new AppError('You are no longer a member of this organization', ErrorCodes.UNAUTHORIZED, 401)
    );

    await expect(
      getPublicApiInsightsSnapshotService(ORG_ID, PROFILE_ID, { scopeType: 'cohort', scopeId: COHORT_ID }, {})
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(mocks.getInsightsDashboardSnapshotForActor).not.toHaveBeenCalled();
  });
});

describe('listPublicApiInsightsStudentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAutomationActor.mockReturnValue(undefined);
    mocks.resolveInsightsActorForCreator.mockResolvedValue(ACTOR);
    mocks.listInsightsStudentsForActor.mockResolvedValue({
      rows: [{ status: 'at_risk' }],
      page: 2,
      limit: INSIGHTS_LIMITS.pageSize,
      total: 45
    });
  });

  it('maps the public sort to the students table sort and pages with the shared pagination', async () => {
    const result = await listPublicApiInsightsStudentsService(ORG_ID, PROFILE_ID, {
      page: 2,
      limit: 25,
      scopeType: 'cohort',
      scopeId: COHORT_ID,
      search: 'ana',
      isOverdue: true,
      sort: 'lastLogin',
      dir: 'desc'
    });

    expect(mocks.listInsightsStudentsForActor).toHaveBeenCalledWith(
      ACTOR,
      { type: 'cohort', id: COHORT_ID },
      {
        courseId: undefined,
        search: 'ana',
        status: undefined,
        isOverdue: true,
        sort: 'last_login',
        dir: 'desc',
        page: 2,
        limit: 25
      }
    );
    expect(result).toEqual({
      items: [{ status: 'at_risk' }],
      pagination: { page: 2, limit: 25, total: 45, totalPages: 2 }
    });
  });

  it('passes optional filters through and defaults to the status table sort', async () => {
    await listPublicApiInsightsStudentsService(ORG_ID, PROFILE_ID, {
      page: 1,
      limit: 20,
      scopeType: 'course',
      scopeId: OTHER_COURSE_ID,
      courseId: OTHER_COURSE_ID,
      status: 'completed',
      isOverdue: undefined,
      sort: 'status'
    });

    expect(mocks.listInsightsStudentsForActor).toHaveBeenCalledWith(
      ACTOR,
      { type: 'course', id: OTHER_COURSE_ID },
      {
        courseId: OTHER_COURSE_ID,
        search: undefined,
        status: 'completed',
        isOverdue: undefined,
        sort: 'status',
        dir: undefined,
        page: 1,
        limit: 20
      }
    );
  });
});
