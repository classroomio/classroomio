import { describe, expect, it } from 'vitest';

import { shouldShowStudentCourseComplianceStatusBadge, getStudentCourseComplianceStatusKey } from './compliance-utils';

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
