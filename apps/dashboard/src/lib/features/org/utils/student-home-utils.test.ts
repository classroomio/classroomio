import { describe, expect, it } from 'vitest';

import { buildStudentHomePageOptions, getStudentHomeWarning, toStudentHomeDestination } from './student-home-utils';
import type { StudentHomeCourseOption } from './types';

const translate = (key: string) => key;

function courseOption(overrides: Partial<StudentHomeCourseOption> = {}): StudentHomeCourseOption {
  return {
    id: 'course-1',
    title: 'Security Basics',
    type: 'SELF_PACED',
    isAvailable: true,
    canSelfEnroll: true,
    ...overrides
  };
}

describe('toStudentHomeDestination', () => {
  it('maps columns to typed destinations', () => {
    expect(toStudentHomeDestination(null)).toBeNull();
    expect(toStudentHomeDestination({})).toBeNull();
    expect(toStudentHomeDestination({ studentHomePath: null, studentHomeCourseId: null })).toBeNull();
    expect(toStudentHomeDestination({ studentHomePath: '/lms/mylearning', studentHomeCourseId: null })).toEqual({
      type: 'page',
      key: 'mylearning'
    });
    expect(toStudentHomeDestination({ studentHomePath: null, studentHomeCourseId: 'course-1' })).toEqual({
      type: 'course',
      courseId: 'course-1'
    });
    expect(toStudentHomeDestination({ studentHomePath: '/lms/mylearning', studentHomeCourseId: 'course-1' })).toEqual({
      type: 'course',
      courseId: 'course-1'
    });
  });

  it('drops unknown stored paths', () => {
    expect(toStudentHomeDestination({ studentHomePath: '/removed', studentHomeCourseId: null })).toBeNull();
  });
});

describe('buildStudentHomePageOptions', () => {
  it('labels every registry page and flags unavailable ones', () => {
    const options = buildStudentHomePageOptions(translate, {
      orgId: 'org-1',
      plans: [{ planName: 'BASIC', isActive: true }],
      isSelfHosted: false,
      customization: { dashboard: {} }
    });

    expect(options).toHaveLength(8);
    expect(options.find((option) => option.key === 'mylearning')).toMatchObject({
      label: 'lms_navigation.my_learning',
      disabled: false,
      disabledReason: null
    });
    expect(options.find((option) => option.key === 'certificates')?.disabledReason).toBe('plan');
    expect(options.find((option) => option.key === 'exercises')?.disabledReason).toBe('customization');
    expect(options.find((option) => option.key === 'community')?.disabledReason).toBe('customization');
  });
});

describe('getStudentHomeWarning', () => {
  it('warns for disabled pages and unavailable courses only', () => {
    const pageOptions = buildStudentHomePageOptions(translate, {
      orgId: 'org-1',
      plans: [{ planName: 'BASIC', isActive: true }],
      isSelfHosted: false,
      customization: { dashboard: {} }
    });

    expect(getStudentHomeWarning(null, pageOptions, null)).toBeNull();
    expect(getStudentHomeWarning({ type: 'page', key: 'mylearning' }, pageOptions, null)).toBeNull();
    expect(getStudentHomeWarning({ type: 'page', key: 'community' }, pageOptions, null)).toBe('unavailable');
    expect(getStudentHomeWarning({ type: 'course', courseId: 'course-1' }, pageOptions, null)).toBeNull();
    expect(getStudentHomeWarning({ type: 'course', courseId: 'course-1' }, pageOptions, [courseOption()])).toBeNull();
    expect(
      getStudentHomeWarning({ type: 'course', courseId: 'course-1' }, pageOptions, [
        courseOption({ isAvailable: false })
      ])
    ).toBe('course-missing');
  });
});
