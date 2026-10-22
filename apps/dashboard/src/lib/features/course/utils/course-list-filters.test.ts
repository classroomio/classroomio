import { describe, expect, it } from 'vitest';

import { buildCourseListSearchParams, parseCourseListFilters } from './course-list-filters';

describe('course list format filter', () => {
  it('parses supported formats and falls back for unknown values', () => {
    expect(parseCourseListFilters(new URLSearchParams('format=standard')).courseFormat).toBe('standard');
    expect(parseCourseListFilters(new URLSearchParams('format=single_activity')).courseFormat).toBe('single_activity');
    expect(parseCourseListFilters(new URLSearchParams('format=unknown')).courseFormat).toBe('all');
  });

  it('serializes the format only when it is active', () => {
    const filters = parseCourseListFilters(new URLSearchParams('format=single_activity'));

    expect(buildCourseListSearchParams(filters).get('format')).toBe('single_activity');
    expect(buildCourseListSearchParams({ ...filters, courseFormat: 'all' }).has('format')).toBe(false);
  });
});
