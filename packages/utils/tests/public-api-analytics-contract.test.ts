import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAnalyticsQueryRequest,
  ZPublicApiAnalyticsSnapshotQuery,
  ZPublicApiAnalyticsStudentsQuery,
  ZPublicApiCourseAnalyticsSnapshotQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiCourseMarketingQuery,
  ZPublicApiMarketingQuery,
  ZPublicApiOrganizationOverviewQuery,
  ZPublicApiRemindOverdueCohortGoals,
  ZPublicApiStudentAnalyticsParam
} from '../src/validation/public-api';

const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';

const VALID_SPEC = {
  source: 'student',
  measures: [{ metric: 'rows', agg: 'value' }]
};

describe('public analytics query contract', () => {
  it('parses the API guide worked query', () => {
    const parsed = ZPublicApiAnalyticsQueryRequest.parse({
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
    const parsed = ZPublicApiAnalyticsQueryRequest.parse({
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
    const result = ZPublicApiAnalyticsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'eq', value: '$course' }] }
    });

    expect(result.success).toBe(false);
  });

  it('accepts an in filter with 100 ids and rejects 101', () => {
    const ids = Array.from({ length: 100 }, (_, index) =>
      `33333333-3333-4333-8333-3333333333${String(index % 10).padStart(2, '0')}`.slice(0, 36)
    );

    const ok = ZPublicApiAnalyticsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'in', value: ids }] }
    });

    expect(ok.success).toBe(true);

    const tooMany = ZPublicApiAnalyticsQueryRequest.safeParse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, filters: [{ field: 'course', op: 'in', value: [...ids, COURSE_ID] }] }
    });

    expect(tooMany.success).toBe(false);
  });

  it('enforces spec limits: measures 1-16, dimensions 0-2, filters 0-10, sort 0-3', () => {
    const base = { scope: { type: 'cohort', id: COHORT_ID } };

    expect(ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, measures: [] } }).success).toBe(
      false
    );

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({
        ...base,
        spec: { ...VALID_SPEC, dimensions: ['student', 'course', 'cohort'] }
      }).success
    ).toBe(false);

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({
        ...base,
        spec: {
          ...VALID_SPEC,
          filters: Array.from({ length: 11 }, () => ({ field: 'course', op: 'eq', value: COURSE_ID }))
        }
      }).success
    ).toBe(false);

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({
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
      ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 3 } }).success
    ).toBe(true);

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 0 } }).success
    ).toBe(false);

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, minGroupRows: 1001 } }).success
    ).toBe(false);
  });

  it('enforces limit 1-1000, page 1-4000, and the offset cap', () => {
    const base = { scope: { type: 'cohort', id: COHORT_ID } };

    expect(ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, limit: 1001 } }).success).toBe(
      false
    );

    expect(ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, page: 4001 } }).success).toBe(
      false
    );

    expect(
      ZPublicApiAnalyticsQueryRequest.safeParse({ ...base, spec: { ...VALID_SPEC, page: 1002, limit: 100 } }).success
    ).toBe(false);
  });

  it('accepts search and the 7/14/30-day login windows on the spec', () => {
    const parsed = ZPublicApiAnalyticsQueryRequest.parse({
      scope: { type: 'cohort', id: COHORT_ID },
      spec: { ...VALID_SPEC, source: 'login_day', search: ' ana ', days: 14 }
    });

    expect(parsed.spec.search).toBe('ana');
    expect(parsed.spec.days).toBe(14);
  });
});

const requestSchemas = {
  ZPublicApiMarketingQuery,
  ZPublicApiCourseMarketingQuery,
  ZPublicApiOrganizationOverviewQuery,
  ZPublicApiStudentAnalyticsParam,
  ZPublicApiAnalyticsSnapshotQuery,
  ZPublicApiCourseAnalyticsSnapshotQuery,
  ZPublicApiAnalyticsStudentsQuery,
  ZPublicApiCourseAnalyticsStudentsQuery
};

describe('public API analytics request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });
});

describe('public marketing contract', () => {
  it('defaults to the traffic section with bounded windows and limits', () => {
    expect(ZPublicApiMarketingQuery.parse({})).toEqual({ include: ['traffic'], days: 30, limit: 5 });
    expect(ZPublicApiCourseMarketingQuery.parse({})).toEqual({ days: 30 });
  });

  it('accepts include as a comma list or an array', () => {
    expect(ZPublicApiMarketingQuery.parse({ include: 'traffic, funnel' }).include).toEqual(['traffic', 'funnel']);
    expect(ZPublicApiMarketingQuery.parse({ include: ['topCourses'] }).include).toEqual(['topCourses']);
  });

  it.each([
    [ZPublicApiMarketingQuery, { days: '14' }],
    [ZPublicApiMarketingQuery, { include: 'summary' }],
    [ZPublicApiMarketingQuery, { include: 'compliance' }],
    [ZPublicApiMarketingQuery, { include: '' }],
    [ZPublicApiMarketingQuery, { limit: '21' }],
    [ZPublicApiCourseMarketingQuery, { days: '14' }]
  ] as const)('rejects out-of-contract input %#', (schema, input) => {
    expect(schema.safeParse(input).success).toBe(false);
  });
});

describe('public organization overview contract', () => {
  it('defaults to the summary section with bounded windows and limits', () => {
    expect(ZPublicApiOrganizationOverviewQuery.parse({})).toEqual({ include: ['summary'], days: 30, limit: 5 });
  });

  it('accepts include as a comma list or an array', () => {
    expect(ZPublicApiOrganizationOverviewQuery.parse({ include: 'summary, loginActivity' }).include).toEqual([
      'summary',
      'loginActivity'
    ]);
    expect(ZPublicApiOrganizationOverviewQuery.parse({ include: ['loginActivity'] }).include).toEqual([
      'loginActivity'
    ]);
  });

  it.each([
    [ZPublicApiOrganizationOverviewQuery, { include: 'overview' }],
    [ZPublicApiOrganizationOverviewQuery, { include: 'traffic' }],
    [ZPublicApiOrganizationOverviewQuery, { days: '14' }],
    [ZPublicApiOrganizationOverviewQuery, { limit: '0' }]
  ] as const)('rejects out-of-contract input %#', (schema, input) => {
    expect(schema.safeParse(input).success).toBe(false);
  });
});

describe('public student analytics contract', () => {
  it('takes a uuid profileId', () => {
    expect(ZPublicApiStudentAnalyticsParam.safeParse({ profileId: COHORT_ID }).success).toBe(true);
    expect(ZPublicApiStudentAnalyticsParam.safeParse({ profileId: 'not-a-uuid' }).success).toBe(false);
    expect(ZPublicApiStudentAnalyticsParam.safeParse({ profileId: '7' }).success).toBe(false);
  });
});

describe('public analytics snapshot contract', () => {
  it('parses an empty selection', () => {
    expect(ZPublicApiAnalyticsSnapshotQuery.parse({})).toEqual({});
    expect(ZPublicApiCourseAnalyticsSnapshotQuery.parse({})).toEqual({});
  });

  it('drops a courseId from the course snapshot, because the course comes from the path', () => {
    expect(ZPublicApiCourseAnalyticsSnapshotQuery.parse({ courseId: COURSE_ID, range: '7d' })).toEqual({
      range: '7d'
    });
  });

  it('accepts breakdown cohorts and rejects the dashboard-internal core', () => {
    expect(ZPublicApiAnalyticsSnapshotQuery.parse({ breakdown: 'cohorts' }).breakdown).toBe('cohorts');
    expect(ZPublicApiAnalyticsSnapshotQuery.safeParse({ breakdown: 'core' }).success).toBe(false);
    expect(ZPublicApiAnalyticsSnapshotQuery.safeParse({ range: '14d' }).success).toBe(false);
  });

  it('accepts the selection passthrough of course, exercise, breakdown and range', () => {
    expect(
      ZPublicApiAnalyticsSnapshotQuery.parse({
        courseId: COURSE_ID,
        exerciseId: COURSE_ID,
        range: '30d',
        breakdown: 'courses'
      })
    ).toEqual({ courseId: COURSE_ID, exerciseId: COURSE_ID, range: '30d', breakdown: 'courses' });
  });
});

describe('public analytics students contract', () => {
  it('parses the students query with defaults and coerces isOverdue strings', () => {
    const parsed = ZPublicApiAnalyticsStudentsQuery.parse({});

    expect(parsed).toMatchObject({ page: 1, limit: 20, sort: 'status' });
    expect(parsed.isOverdue).toBeUndefined();

    expect(ZPublicApiAnalyticsStudentsQuery.parse({ isOverdue: 'true' }).isOverdue).toBe(true);
    expect(ZPublicApiAnalyticsStudentsQuery.parse({ isOverdue: 'false' }).isOverdue).toBe(false);
  });

  it('maps lastLogin but rejects the dashboard-internal low_score sort', () => {
    expect(ZPublicApiAnalyticsStudentsQuery.parse({ sort: 'lastLogin' }).sort).toBe('lastLogin');
    expect(ZPublicApiAnalyticsStudentsQuery.safeParse({ sort: 'low_score' }).success).toBe(false);
  });

  it('drops a scopeType and scopeId, because the scope comes from the path', () => {
    const parsed = ZPublicApiAnalyticsStudentsQuery.parse({ scopeType: 'cohort', scopeId: COHORT_ID });

    expect(parsed).not.toHaveProperty('scopeType');
    expect(parsed).not.toHaveProperty('scopeId');
  });

  it('drops the courseId filter from the course students query', () => {
    expect(ZPublicApiCourseAnalyticsStudentsQuery.parse({ courseId: COURSE_ID })).not.toHaveProperty('courseId');
    expect(ZPublicApiAnalyticsStudentsQuery.parse({ courseId: COURSE_ID }).courseId).toBe(COURSE_ID);
  });

  it('enforces the students limit of 1-100', () => {
    expect(ZPublicApiAnalyticsStudentsQuery.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('caps the students page at 4000 and enforces the offset cap', () => {
    expect(ZPublicApiAnalyticsStudentsQuery.safeParse({ page: 4001 }).success).toBe(false);

    expect(ZPublicApiAnalyticsStudentsQuery.safeParse({ page: 1002, limit: 100 }).success).toBe(false);

    expect(ZPublicApiAnalyticsStudentsQuery.safeParse({ page: 1001, limit: 100 }).success).toBe(true);
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
