import { describe, expect, it, beforeEach } from 'vitest';
import { clearPendingCourseEnroll, consumePendingCourseEnroll, setPendingCourseEnroll } from './pending-course-enroll';

describe('pending-course-enroll', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and consumes a pending enrollment for the matching course', () => {
    setPendingCourseEnroll('course-1');

    expect(consumePendingCourseEnroll('course-1')).toBe(true);
    expect(sessionStorage.getItem('cio_pending_course_enroll')).toBeNull();
  });

  it('does not consume a pending enrollment for a different course', () => {
    setPendingCourseEnroll('course-1');

    expect(consumePendingCourseEnroll('course-2')).toBe(false);
    expect(sessionStorage.getItem('cio_pending_course_enroll')).not.toBeNull();
  });

  it('clears invalid pending enrollment payloads', () => {
    sessionStorage.setItem('cio_pending_course_enroll', 'not-json');

    expect(consumePendingCourseEnroll('course-1')).toBe(false);
    expect(sessionStorage.getItem('cio_pending_course_enroll')).toBeNull();
  });

  it('clears pending enrollment explicitly', () => {
    setPendingCourseEnroll('course-1');
    clearPendingCourseEnroll();

    expect(sessionStorage.getItem('cio_pending_course_enroll')).toBeNull();
  });
});
