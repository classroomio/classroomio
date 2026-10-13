import { describe, expect, it } from 'vitest';

import { isSingleActivityCourse } from './course-format';

describe('isSingleActivityCourse', () => {
  it('detects single-activity courses', () => {
    expect(isSingleActivityCourse({ format: 'single_activity' })).toBe(true);
    expect(isSingleActivityCourse({ format: 'standard' })).toBe(false);
    expect(isSingleActivityCourse(null)).toBe(false);
    expect(isSingleActivityCourse(undefined)).toBe(false);
    expect(isSingleActivityCourse({})).toBe(false);
  });
});
