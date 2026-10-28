import { describe, expect, it } from 'vitest';

import { runInsightsQuery } from '@cio/db/queries/insights';
import { ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';

const scope = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID };
const spec = ZInsightsQuerySpec.parse({
  source: 'student',
  measures: [{ metric: 'rows', agg: 'count' }],
  limit: 10,
  page: 2
});

describe('runInsightsQuery', () => {
  it('keeps the total when the requested page is past the end', async () => {
    const results: Array<Array<Record<string, unknown>>> = [[], [{ __total: 7 }]];
    let call = 0;
    const client = {
      execute: async () => results[call++] ?? []
    };

    const result = await runInsightsQuery(spec, { scope, orderedItems: [] }, client as never);

    expect(result.rows).toEqual([]);
    expect(result.total).toBe(7);
    expect(call).toBe(2);
  });

  it('does not run a second query for an empty first page', async () => {
    let calls = 0;
    const client = {
      execute: async () => {
        calls += 1;

        return [];
      }
    };

    const result = await runInsightsQuery({ ...spec, page: 1 }, { scope, orderedItems: [] }, client as never);

    expect(result.total).toBe(0);
    expect(calls).toBe(1);
  });

  it('falls back to zero when the count query fails', async () => {
    let calls = 0;
    const client = {
      execute: async () => {
        calls += 1;
        if (calls === 2) throw new Error('count failed');

        return [];
      }
    };

    const result = await runInsightsQuery(spec, { scope, orderedItems: [] }, client as never);

    expect(result.total).toBe(0);
  });
});
