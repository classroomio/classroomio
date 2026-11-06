import { describe, expect, it } from 'vitest';

import {
  ZPublicApiInsightsDashboardParam,
  ZPublicApiInsightsQueryRequest,
  ZPublicApiInsightsSnapshotQuery,
  ZPublicApiInsightsStudentsQuery,
  ZPublicApiRemindOverdueCohortGoals
} from '../src/validation/public-api/insights';

const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const VALID_SPEC = {
  source: 'student',
  measures: [{ metric: 'rows', agg: 'value' }]
};

describe('public insights query contract', () => {
  it('parses the API guide worked query', () => {
    const parsed = ZPublicApiInsightsQueryRequest.parse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: {
        source: 'student',
        dimensions: ['student'],
        measures: [
          { metric: 'name', agg: 'value' },
          { metric: 'avg_score_pct', agg: 'avg' }
        ],
        filters: [{ field: 'status', op: 'eq', value: 'at_risk' }],
        sort: [{ field: 'avg_score_pct__avg', dir: 'asc' }],
        limit: 25
      }
    });

    expect(parsed.spec.dimensions).toEqual(['student']);
    expect(parsed.spec.limit).toBe(25);
  });

  it('parses a full request body with defaults filled', () => {
    const parsed = ZPublicApiInsightsQueryRequest.parse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: VALID_SPEC
    });

    expect(parsed.spec).toMatchObject({
      dimensions: [],
      filters: [],
      sort: [],
      limit: 25,
      page: 1,
      range: 'all'
    });
  });

  it('rejects a filter value that starts with $', () => {
    const result = ZPublicApiInsightsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'eq', value: '$course' }] }
    });

    expect(result.success).toBe(false);
  });

  it('accepts an in filter with 100 ids and rejects 101', () => {
    const ids = Array.from({ length: 100 }, (_, index) =>
      `33333333-3333-4333-8333-3333333333${String(index % 10).padStart(2, '0')}`.slice(0, 36)
    );

    const ok = ZPublicApiInsightsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'in', value: ids }] }
    });

    expect(ok.success).toBe(true);

    const tooMany = ZPublicApiInsightsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'in', value: [...ids, COURSE_ID] }] }
    });

    expect(tooMany.success).toBe(false);
  });

  it('enforces spec limits: measures 1-16, dimensions 0-2, filters 0-10, sort 0-3', () => {
    const base = { scope: { type: 'cohort', id: COHORT_ID } };

    expect(ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, measures: [] } }).success).toBe(
      false
    );

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({
        ...base,
        spec: { ...VALID_SPEC, dimensions: ['student', 'course', 'cohort'] }
      }).success
    ).toBe(false);

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({
        ...base,
        spec: {
          ...VALID_SPEC,
          filters: Array.from({ length: 11 }, () => ({ field: 'course', op: 'eq', value: COURSE_ID }))
        }
      }).success
    ).toBe(false);

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({
        ...base,
        spec: {
          ...VALID_SPEC,
          sort: Array.from({ length: 4 }, () => ({ field: 'rows__count', dir: 'asc' }))
        }
      }).success
    ).toBe(false);
  });

  it('accepts an optional bounded minGroupRows for paging widget specs', () => {
    const base = { scope: { type: 'cohort', id: COHORT_ID } };

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 3 } }).success
    ).toBe(true);

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 0 } }).success
    ).toBe(false);

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 1001 } }).success
    ).toBe(false);
  });

  it('enforces limit 1-1000, page 1-4000, and the offset cap', () => {
    const base = { scope: { type: 'cohort', id: COHORT_ID } };

    expect(ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, limit: 1001 } }).success).toBe(
      false
    );

    expect(ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, page: 4001 } }).success).toBe(
      false
    );

    expect(
      ZPublicApiInsightsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, page: 1002, limit: 100 } }).success
    ).toBe(false);
  });

  it('accepts search and the 7/14/30-day login windows on the spec', () => {
    const parsed = ZPublicApiInsightsQueryRequest.parse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, source: 'login_day', search: ' ana ', days: 14 }
    });

    expect(parsed.spec.search).toBe('ana');
    expect(parsed.spec.days).toBe(14);
  });
});

describe('public insights snapshot contract', () => {
  it('parses dashboard params and an empty selection', () => {
    expect(ZPublicApiInsightsDashboardParam.parse({ scopeType: 'cohort', scopeId: COHORT_ID })).toEqual({
      scopeType: 'cohort',
      scopeId: COHORT_ID
    });
    expect(ZPublicApiInsightsSnapshotQuery.parse({})).toEqual({});
  });

  it('accepts breakdown cohorts and rejects the dashboard-internal core', () => {
    expect(ZPublicApiInsightsSnapshotQuery.parse({ breakdown: 'cohorts' }).breakdown).toBe('cohorts');
    expect(ZPublicApiInsightsSnapshotQuery.safeParse({ breakdown: 'core' }).success).toBe(false);
    expect(ZPublicApiInsightsSnapshotQuery.safeParse({ range: '14d' }).success).toBe(false);
  });

  it('accepts the selection passthrough of course, exercise, breakdown and range', () => {
    expect(
      ZPublicApiInsightsSnapshotQuery.parse({
        courseId: COURSE_ID,
        exerciseId: COURSE_ID,
        range: '30d',
        breakdown: 'courses'
      })
    ).toEqual({ courseId: COURSE_ID, exerciseId: COURSE_ID, range: '30d', breakdown: 'courses' });
  });
});

describe('public insights students contract', () => {
  it('parses the students query with defaults and coerces isOverdue strings', () => {
    const parsed = ZPublicApiInsightsStudentsQuery.parse({ scopeType: 'cohort', scopeId: COHORT_ID });

    expect(parsed).toMatchObject({ page: 1, limit: 20, sort: 'status' });
    expect(parsed.isOverdue).toBeUndefined();

    expect(
      ZPublicApiInsightsStudentsQuery.parse({ scopeType: 'cohort', scopeId: COHORT_ID, isOverdue: 'true' }).isOverdue
    ).toBe(true);
    expect(
      ZPublicApiInsightsStudentsQuery.parse({ scopeType: 'cohort', scopeId: COHORT_ID, isOverdue: 'false' }).isOverdue
    ).toBe(false);
  });

  it('maps lastLogin but rejects the dashboard-internal low_score sort', () => {
    expect(
      ZPublicApiInsightsStudentsQuery.parse({ scopeType: 'cohort', scopeId: COHORT_ID, sort: 'lastLogin' }).sort
    ).toBe('lastLogin');
    expect(
      ZPublicApiInsightsStudentsQuery.safeParse({ scopeType: 'cohort', scopeId: COHORT_ID, sort: 'low_score' }).success
    ).toBe(false);
  });

  it('enforces the students limit of 1-100', () => {
    expect(
      ZPublicApiInsightsStudentsQuery.safeParse({ scopeType: 'org', scopeId: COHORT_ID, limit: 101 }).success
    ).toBe(false);
  });

  it('caps the students page at 4000 and enforces the offset cap', () => {
    expect(
      ZPublicApiInsightsStudentsQuery.safeParse({ scopeType: 'org', scopeId: COHORT_ID, page: 4001 }).success
    ).toBe(false);

    expect(
      ZPublicApiInsightsStudentsQuery.safeParse({ scopeType: 'org', scopeId: COHORT_ID, page: 1002, limit: 100 })
        .success
    ).toBe(false);

    expect(
      ZPublicApiInsightsStudentsQuery.safeParse({ scopeType: 'org', scopeId: COHORT_ID, page: 1001, limit: 100 })
        .success
    ).toBe(true);
  });
});

describe('public remind contract', () => {
  it('parses an empty remind body and the course/profile narrowings', () => {
    expect(ZPublicApiRemindOverdueCohortGoals.parse({})).toEqual({});
    expect(ZPublicApiRemindOverdueCohortGoals.parse({ courseId: COURSE_ID, profileId: COHORT_ID })).toEqual({
      courseId: COURSE_ID,
      profileId: COHORT_ID
    });
  });

  it('rejects non-uuid narrowings', () => {
    expect(ZPublicApiRemindOverdueCohortGoals.safeParse({ courseId: 'nope' }).success).toBe(false);
  });
});
