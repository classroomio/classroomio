import { describe, expect, it } from 'vitest';

import {
  getStudentCourseProgressPercent,
  isStudentCourseComplete,
  shouldShowStudentCourseComplianceStatusBadge,
  getStudentCourseComplianceStatusKey
} from './compliance-utils';

function makeCourse(overrides: { type?: string; complianceStatus?: string | null }) {
  return {
    type: overrides.type ?? 'COMPLIANCE',
    complianceStatus: overrides.complianceStatus
  } as Parameters<typeof shouldShowStudentCourseComplianceStatusBadge>[0];
}

describe('shouldShowStudentCourseComplianceStatusBadge', () => {
  it('hides the in-progress badge on learner course cards', () => {
    const course = makeCourse({ complianceStatus: 'in_progress' });

    expect(shouldShowStudentCourseComplianceStatusBadge(course)).toBe(false);
    expect(getStudentCourseComplianceStatusKey(course)).toBe('course.navItem.compliance.status.in_progress');
  });

  it('still shows overdue and expiring statuses', () => {
    expect(shouldShowStudentCourseComplianceStatusBadge(makeCourse({ complianceStatus: 'non_compliant' }))).toBe(true);
    expect(shouldShowStudentCourseComplianceStatusBadge(makeCourse({ complianceStatus: 'expiring_soon' }))).toBe(true);
  });

  it('is hidden for non-compliance courses', () => {
    expect(
      shouldShowStudentCourseComplianceStatusBadge(makeCourse({ type: 'SELF_PACED', complianceStatus: 'in_progress' }))
    ).toBe(false);
  });
});

describe('getStudentCourseProgressPercent with activities', () => {
  it('ignores missing activity fields for courses without packages', () => {
    const course = {
      type: 'SELF_PACED',
      lessonCount: 4,
      progressRate: 2,
      exerciseCount: 2,
      exercisesCompleted: 1
    } as Parameters<typeof getStudentCourseProgressPercent>[0];

    expect(getStudentCourseProgressPercent(course)).toBe(50);
  });

  it('counts packages alongside lessons and exercises', () => {
    const course = {
      type: 'SELF_PACED',
      lessonCount: 2,
      progressRate: 2,
      exerciseCount: 0,
      exercisesCompleted: 0,
      activityCount: 2,
      activitiesCompleted: 1
    } as Parameters<typeof getStudentCourseProgressPercent>[0];

    expect(getStudentCourseProgressPercent(course)).toBe(75);
    expect(isStudentCourseComplete(course)).toBe(false);
  });

  it('completes only when every package is done', () => {
    const course = {
      type: 'SELF_PACED',
      lessonCount: 1,
      progressRate: 1,
      exerciseCount: 0,
      exercisesCompleted: 0,
      activityCount: 1,
      activitiesCompleted: 1
    } as Parameters<typeof getStudentCourseProgressPercent>[0];

    expect(getStudentCourseProgressPercent(course)).toBe(100);
    expect(isStudentCourseComplete(course)).toBe(true);
  });
});
