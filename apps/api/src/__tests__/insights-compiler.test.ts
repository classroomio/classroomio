import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { compileInsightsQuery, requiresOrderedItems, type InsightsScopeRef } from '@cio/db/queries/insights';
import { ZInsightsExportSpec, ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const dialect = new PgDialect();
const scope = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID };

function compile(input: unknown) {
  const spec = ZInsightsQuerySpec.parse(input);
  const { query, columns } = compileInsightsQuery(spec, { scope, orderedItems: [] });

  return { ...dialect.sqlToQuery(query), columns };
}

describe('compileInsightsQuery', () => {
  it('binds the org id and never inlines filter values', () => {
    const compiled = compile({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
    });

    expect(compiled.params).toContain(ORG_ID);
    expect(compiled.params).toContain(COURSE_ID);
    expect(compiled.sql).not.toContain(COURSE_ID);
  });

  it('escapes LIKE wildcards in search', () => {
    const compiled = compile({ source: 'student', measures: [{ metric: 'rows', agg: 'count' }], search: '50%_off' });

    expect(compiled.params).toContain('%50\\%\\_off%');
  });

  it('rejects a metric the source does not define', () => {
    expect(() => compile({ source: 'login_day', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] })).toThrow(
      /not available/
    );
  });

  it('rejects a placeholder that was never replaced', () => {
    expect(() =>
      compile({
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'course', op: 'eq', value: '$course' }]
      })
    ).toThrow(/uuid/);
  });

  it('joins the cohort bridge only when grouping by cohort', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const plain = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({ source: 'student', measures: [{ metric: 'rows', agg: 'count' }] }),
        {
          scope: courseScope,
          orderedItems: []
        }
      ).query
    );
    const grouped = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'student',
          dimensions: ['cohort'],
          measures: [{ metric: 'rows', agg: 'count' }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(plain.sql).not.toContain('bridge');
    expect(grouped.sql).toContain('bridge');
  });

  it('joins the cohort bridge when filtering by cohort in pushdown', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const filtered = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'student',
          measures: [{ metric: 'rows', agg: 'count' }],
          filters: [{ field: 'cohort', op: 'eq', value: COHORT_ID }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(filtered.sql).toContain('bridge');
  });

  it('joins the cohort bridge for cohort_summary even without a cohort dimension', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          measures: [{ metric: 'students', agg: 'value' }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('bridge');
  });

  it('filters empty cohorts on cohort_summary before paging', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          dimensions: ['cohort'],
          measures: [{ metric: 'students', agg: 'value' }],
          filters: [{ field: 'students', op: 'gte', value: 1 }],
          limit: 4
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('base.students >=');
    expect(compiled.params).toContain(1);
  });

  it('refuses the cohort_summary students filter on another source', () => {
    expect(() =>
      compile({
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'students', op: 'gte', value: 1 }]
      })
    ).toThrow(/not available/);
  });

  it('filters empty cohorts on cohort_summary before paging', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          dimensions: ['cohort'],
          measures: [{ metric: 'students', agg: 'value' }],
          filters: [{ field: 'students', op: 'lt', value: 1 }],
          limit: 3
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('base.students <');
    expect(compiled.params).toContain(1);
  });

  it('searches cohort_summary by cohort name', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          dimensions: ['cohort'],
          measures: [{ metric: 'students', agg: 'value' }],
          search: 'spring'
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('base.cohort_name');
    expect(compiled.params).toContain('%spring%');
  });

  it('accepts the attempted filter only on assessment_result', () => {
    const compiled = compile({
      source: 'assessment_result',
      dimensions: ['student', 'exercise'],
      measures: [{ metric: 'best_score_pct', agg: 'value' }],
      filters: [{ field: 'is_attempted', op: 'is_true' }]
    });

    expect(compiled.sql).toContain('base.is_attempted IS TRUE');

    expect(() =>
      compile({
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'is_attempted', op: 'is_true' }]
      })
    ).toThrow(/not available/);
  });

  it('reads overdue per cohort when the cohort bridge is active', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          measures: [{ metric: 'overdue_students', agg: 'value' }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('bool_or(lcr.is_overdue)');
    expect(compiled.sql).not.toContain('LEFT JOIN overdue_student ola');
  });

  it('keeps the profile-level overdue flag without a cohort breakdown', () => {
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'student',
          measures: [{ metric: 'is_overdue', agg: 'count_if' }]
        }),
        { scope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('LEFT JOIN overdue_student ola');
    expect(compiled.sql).not.toContain('bool_or(lcr.is_overdue)');
  });

  it('accepts a course filter on cohort_summary', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const compiled = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'cohort_summary',
          dimensions: ['cohort'],
          measures: [{ metric: 'students', agg: 'value' }],
          filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('cohort_course');
    expect(compiled.params).toContain(COURSE_ID);
  });

  it('refuses overdue_student at org scope', () => {
    const orgScope = { orgId: ORG_ID, type: 'org' as const, id: ORG_ID };

    expect(() =>
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'overdue_student',
          dimensions: ['student'],
          measures: [{ metric: 'name', agg: 'value' }]
        }),
        { scope: orgScope, orderedItems: [] }
      )
    ).toThrow(/not available for org scope/);
  });

  it('defaults the range to all and lets the range set the login window', () => {
    const allTime = compile({
      source: 'login_day',
      dimensions: ['day'],
      measures: [{ metric: 'logged_in', agg: 'rate' }],
      days: 7
    });
    const thirtyDays = compile({
      source: 'login_day',
      dimensions: ['day'],
      measures: [{ metric: 'logged_in', agg: 'rate' }],
      range: '30d',
      days: 7
    });

    expect(allTime.params).toContain(6);
    expect(thirtyDays.params).toContain(29);
    expect(thirtyDays.params).not.toContain(6);
  });

  it('rejects an unknown range', () => {
    expect(() => compile({ source: 'student', measures: [{ metric: 'rows', agg: 'count' }], range: '1y' })).toThrow();
  });

  it('applies limit and page as a row offset and caps export limit', () => {
    const compiled = compile({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: 50,
      page: 3
    });

    expect(compiled.params).toContain(50);
    expect(compiled.params).toContain(100);
    expect(compiled.sql).toMatch(/LIMIT \$\d+ OFFSET \$\d+/);

    const exportSpec = ZInsightsExportSpec.parse({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: 5000
    });
    const compiledExport = dialect.sqlToQuery(
      compileInsightsQuery(exportSpec as any, { scope, orderedItems: [] }).query
    );
    expect(compiledExport.params).toContain(5000);
  });

  it('rejects sort by a field not in dimensions or measures', () => {
    expect(() =>
      compile({
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }],
        sort: [{ field: 'unselected_field', dir: 'asc' }]
      })
    ).toThrow(/Cannot sort by unselected_field/);
  });

  it('rejects a dimension not available on the source', () => {
    expect(() =>
      compile({
        source: 'login_day',
        dimensions: ['exercise'],
        measures: [{ metric: 'rows', agg: 'count' }]
      })
    ).toThrow(/Dimension exercise is not available on login_day/);
  });

  it('identifies specs that require ordered outline items', () => {
    expect(
      requiresOrderedItems({
        dimensions: ['exercise'],
        measures: [{ metric: 'rows', agg: 'count' }]
      })
    ).toBe(true);

    expect(
      requiresOrderedItems({
        dimensions: ['student'],
        measures: [{ metric: 'now_at_item_id', agg: 'value' }]
      })
    ).toBe(true);

    expect(
      requiresOrderedItems({
        dimensions: ['student'],
        measures: [{ metric: 'rows', agg: 'count' }]
      })
    ).toBe(false);
  });

  it('rejects a non-numeric value for a numeric predicate filter', () => {
    expect(() =>
      compile({
        source: 'student',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'avg_score_pct', op: 'gte', value: 'abc' }]
      })
    ).toThrow(/numeric values/);
  });

  it('accepts a numeric value for a numeric predicate filter', () => {
    const compiled = compile({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'avg_score_pct', op: 'gte', value: 40 }]
    });

    expect(compiled.params).toContain(40);
  });

  it('intersects repeated filters on the same pushdown field', () => {
    const otherCourseId = '44444444-4444-4444-8444-444444444444';
    const compiled = compile({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [
        { field: 'course', op: 'in', value: [COURSE_ID, otherCourseId] },
        { field: 'course', op: 'eq', value: COURSE_ID }
      ]
    });

    expect(compiled.params).toContain(COURSE_ID);
    expect(compiled.params).not.toContain(otherCourseId);
    expect(compiled.sql).not.toContain('1 = 0');
  });

  it('returns no rows when repeated pushdown filters do not overlap', () => {
    const compiled = compile({
      source: 'student',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [
        { field: 'course', op: 'eq', value: COURSE_ID },
        { field: 'course', op: 'eq', value: '44444444-4444-4444-8444-444444444444' }
      ]
    });

    expect(compiled.sql).toContain('1 = 0');
    expect(compiled.params).not.toContain(COURSE_ID);
  });

  it('never links an exercise to a lesson', () => {
    const sources: Array<{
      source: string;
      measure: { metric: string; agg: 'count' | 'sum' };
      scope: InsightsScopeRef;
    }> = [
      {
        source: 'student',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'student_course',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'assessment_result',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'section_activity',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'question_result',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'lesson_progress',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'login_day',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'overdue_item',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      },
      {
        source: 'org_member',
        measure: { metric: 'members_total', agg: 'sum' },
        scope: { orgId: ORG_ID, type: 'org', id: ORG_ID }
      },
      {
        source: 'cohort_summary',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'org', id: ORG_ID }
      },
      {
        source: 'overdue_student',
        measure: { metric: 'rows', agg: 'count' },
        scope: { orgId: ORG_ID, type: 'cohort', id: COHORT_ID }
      }
    ];

    for (const { source, measure, scope: testScope } of sources) {
      const spec = ZInsightsQuerySpec.parse({ source, measures: [measure] });
      const { query } = compileInsightsQuery(spec, { scope: testScope, orderedItems: [] });
      const compiled = dialect.sqlToQuery(query);

      expect(compiled.sql).not.toContain('exercise.lesson_id');
      expect(compiled.sql).not.toContain('exercise_lesson_id_fkey');
    }
  });
});
