import * as z from 'zod';
import { describe, expect, it } from 'vitest';

import {
  ZPublicApiCourseAnalyticsQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiLearnerAnalyticsParam,
  ZPublicApiOrgAnalyticsQuery
} from '../src/validation/public-api';

// The public API is versioned; a change to any of these shapes is a contract change and must be deliberate.
const requestSchemas = {
  ZPublicApiOrgAnalyticsQuery,
  ZPublicApiCourseAnalyticsQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiLearnerAnalyticsParam
};

describe('public API analytics request contract', () => {
  it.each(Object.entries(requestSchemas))('%s keeps its published shape', (name, schema) => {
    expect(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' })).toMatchSnapshot(name);
  });

  it('defaults to the cheap sections with bounded windows and limits', () => {
    expect(ZPublicApiOrgAnalyticsQuery.parse({})).toEqual({ include: ['overview'], days: 30, limit: 5 });
    expect(ZPublicApiCourseAnalyticsQuery.parse({})).toEqual({ include: ['summary'], days: 30 });
    expect(ZPublicApiCourseAnalyticsStudentsQuery.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('accepts include as a comma list or an array', () => {
    expect(ZPublicApiOrgAnalyticsQuery.parse({ include: 'traffic, funnel' }).include).toEqual(['traffic', 'funnel']);
    expect(ZPublicApiOrgAnalyticsQuery.parse({ include: ['compliance'] }).include).toEqual(['compliance']);
  });

  it.each([
    [ZPublicApiOrgAnalyticsQuery, { days: '14' }],
    [ZPublicApiOrgAnalyticsQuery, { include: 'summary' }],
    [ZPublicApiOrgAnalyticsQuery, { include: '' }],
    [ZPublicApiOrgAnalyticsQuery, { limit: '21' }],
    [ZPublicApiCourseAnalyticsQuery, { include: 'traffic' }],
    [ZPublicApiCourseAnalyticsStudentsQuery, { limit: '51' }],
    [ZPublicApiLearnerAnalyticsParam, { profileId: 'not-a-uuid' }]
  ] as const)('rejects out-of-contract input %#', (schema, input) => {
    expect(schema.safeParse(input).success).toBe(false);
  });
});
