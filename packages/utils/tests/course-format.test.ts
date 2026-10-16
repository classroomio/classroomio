import { describe, expect, it } from 'vitest';

import { ZCourseCreate, ZCourseUpdate } from '../src/validation/course/course';

const base = {
  title: 'Package course',
  description: 'A single package',
  organizationId: 'org-1'
};

describe('ZCourseCreate SCORM format', () => {
  it('accepts Self-paced SCORM courses', () => {
    expect(ZCourseCreate.safeParse({ ...base, type: 'SELF_PACED', format: 'single_activity' }).success).toBe(true);
  });

  it('refuses Compliance SCORM courses', () => {
    const result = ZCourseCreate.safeParse({
      ...base,
      type: 'COMPLIANCE',
      format: 'single_activity',
      compliance: { retakeIntervalMonths: 12 }
    });

    expect(result.success).toBe(false);
  });

  it('refuses other types for SCORM courses', () => {
    for (const type of ['LIVE_CLASS', 'PUBLIC'] as const) {
      const result = ZCourseCreate.safeParse({ ...base, type, format: 'single_activity' });

      expect(result.success).toBe(false);
    }
  });

  it('leaves standard courses unrestricted', () => {
    expect(ZCourseCreate.safeParse({ ...base, type: 'LIVE_CLASS' }).success).toBe(true);
  });
});

describe('ZCourseUpdate SCORM format', () => {
  it('converts scorm to standard only', () => {
    expect(ZCourseUpdate.safeParse({ format: 'standard' }).success).toBe(true);
    expect(ZCourseUpdate.safeParse({ format: 'single_activity' }).success).toBe(false);
  });
});
