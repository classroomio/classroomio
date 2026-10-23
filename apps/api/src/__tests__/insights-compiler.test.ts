import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { compileInsightsQuery, requiresOrderedItems } from '@cio/db/queries/insights';
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
      source: 'learner',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
    });

    expect(compiled.params).toContain(ORG_ID);
    expect(compiled.params).toContain(COURSE_ID);
    expect(compiled.sql).not.toContain(COURSE_ID);
  });

  it('escapes LIKE wildcards in search', () => {
    const compiled = compile({ source: 'learner', measures: [{ metric: 'rows', agg: 'count' }], search: '50%_off' });

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
        source: 'learner',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'course', op: 'eq', value: '$course' }]
      })
    ).toThrow(/uuid/);
  });

  it('joins the cohort bridge only when grouping by cohort', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const plain = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({ source: 'learner', measures: [{ metric: 'rows', agg: 'count' }] }),
        {
          scope: courseScope,
          orderedItems: []
        }
      ).query
    );
    const grouped = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'learner',
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
          source: 'learner',
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
          measures: [{ metric: 'learners', agg: 'value' }]
        }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(compiled.sql).toContain('bridge');
  });

  it('refuses overdue_learner at org scope', () => {
    const orgScope = { orgId: ORG_ID, type: 'org' as const, id: ORG_ID };

    expect(() =>
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({
          source: 'overdue_learner',
          dimensions: ['learner'],
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
    expect(() => compile({ source: 'learner', measures: [{ metric: 'rows', agg: 'count' }], range: '1y' })).toThrow();
  });

  it('applies limit and page as a row offset and caps export limit', () => {
    const compiled = compile({
      source: 'learner',
      measures: [{ metric: 'rows', agg: 'count' }],
      limit: 50,
      page: 3
    });

    expect(compiled.params).toContain(50);
    expect(compiled.params).toContain(100);
    expect(compiled.sql).toMatch(/LIMIT \$\d+ OFFSET \$\d+/);

    const exportSpec = ZInsightsExportSpec.parse({
      source: 'learner',
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
        source: 'learner',
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
        dimensions: ['learner'],
        measures: [{ metric: 'now_at_item_id', agg: 'value' }]
      })
    ).toBe(true);

    expect(
      requiresOrderedItems({
        dimensions: ['learner'],
        measures: [{ metric: 'rows', agg: 'count' }]
      })
    ).toBe(false);
  });
});
