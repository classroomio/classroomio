import { describe, expect, it } from 'vitest';

import { ZCourseCreate, ZCourseUpdate } from '../src/validation/course/course';

const base = {
  title: 'Package course',
  description: 'A single package',
  organizationId: 'org-1'
};

describe('ZCourseCreate SCORM format', () => {
  it('accepts Self-paced and Compliance SCORM courses', () => {
    expect(ZCourseCreate.safeParse({ ...base, type: 'SELF_PACED', format: 'scorm' }).success).toBe(true);
    expect(
      ZCourseCreate.safeParse({
        ...base,
        type: 'COMPLIANCE',
        format: 'scorm',
        compliance: { retakeIntervalMonths: 12 }
      }).success
    ).toBe(true);
  });

  it('refuses other types for SCORM courses', () => {
    for (const type of ['LIVE_CLASS', 'PUBLIC'] as const) {
      const result = ZCourseCreate.safeParse({ ...base, type, format: 'scorm' });

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
    expect(ZCourseUpdate.safeParse({ format: 'scorm' }).success).toBe(false);
  });
});
