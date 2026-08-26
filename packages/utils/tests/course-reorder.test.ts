import { describe, expect, it } from 'vitest';

import { ZCourseReorder } from '../src/validation/organization/organization';

const COURSE_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const OTHER_COURSE_ID = 'b2f0a5d4-8c1e-4a6b-9d3f-2e7c8a1b4d5e';

describe('ZCourseReorder', () => {
  it('accepts a valid ordered course list', () => {
    const result = ZCourseReorder.safeParse({
      courses: [
        { id: COURSE_ID, order: 0 },
        { id: OTHER_COURSE_ID, order: 1 }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty course list', () => {
    const result = ZCourseReorder.safeParse({ courses: [] });

    expect(result.success).toBe(false);
  });

  it('rejects a missing course list', () => {
    const result = ZCourseReorder.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects non-UUID course ids', () => {
    const result = ZCourseReorder.safeParse({ courses: [{ id: 'not-a-uuid', order: 0 }] });

    expect(result.success).toBe(false);
  });

  it('rejects non-integer or negative orders', () => {
    const negativeResult = ZCourseReorder.safeParse({ courses: [{ id: COURSE_ID, order: -1 }] });
    const fractionalResult = ZCourseReorder.safeParse({ courses: [{ id: COURSE_ID, order: 1.5 }] });

    expect(negativeResult.success).toBe(false);
    expect(fractionalResult.success).toBe(false);
  });
});
