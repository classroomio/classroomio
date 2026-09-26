import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiAnalyticsFunnelQuery,
  ZPublicApiAnalyticsRangeQuery,
  ZPublicApiLearnerAnalyticsParam,
  ZPublicApiLoginActivityQuery
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiAnalyticsRangeQuery,
  ZPublicApiAnalyticsFunnelQuery,
  ZPublicApiLoginActivityQuery,
  ZPublicApiLearnerAnalyticsParam
};

describe('public API analytics request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('keeps the dashboard day-window bounds and defaults', () => {
    expect(ZPublicApiAnalyticsRangeQuery.parse({})).toEqual({ days: 30 });
    expect(ZPublicApiLoginActivityQuery.parse({})).toEqual({ days: 90 });
    expect(ZPublicApiAnalyticsRangeQuery.safeParse({ days: '0' }).success).toBe(false);
    expect(ZPublicApiAnalyticsRangeQuery.safeParse({ days: '366' }).success).toBe(false);
    expect(ZPublicApiAnalyticsFunnelQuery.safeParse({ courseId: 'not-a-uuid' }).success).toBe(false);
  });
});
