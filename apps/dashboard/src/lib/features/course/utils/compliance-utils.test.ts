import {
  shouldShowStudentCourseComplianceStatusBadge,
  getStudentCourseComplianceStatusKey,
  isComplianceCycleComplete,
  isStudentCourseComplete
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

describe('isComplianceCycleComplete', () => {
  const now = new Date('2026-10-15T00:00:00Z');

  it('counts a waived cycle, or a completed one still inside its validity window, whatever the label', () => {
    expect(isComplianceCycleComplete('waived', null, now)).toBe(true);
    expect(isComplianceCycleComplete('compliant', '2027-01-01T00:00:00Z', now)).toBe(true);
    expect(isComplianceCycleComplete('expiring_soon', '2026-10-22T00:00:00Z', now)).toBe(true);
  });

  it('does not count an unfinished cycle or a lapsed completion', () => {
    for (const status of ['not_started', 'in_progress', 'expiring_soon', 'in_grace_period', 'non_compliant', null]) {
      expect(isComplianceCycleComplete(status, null, now)).toBe(false);
    }
    expect(isComplianceCycleComplete('compliant', '2026-10-01T00:00:00Z', now)).toBe(false);
  });

  it('drives course completion for compliance courses', () => {
    const validCourse = {
      ...makeCourse({ complianceStatus: 'compliant' }),
      complianceValidUntil: '2099-01-01T00:00:00Z'
    };

    expect(isStudentCourseComplete(validCourse)).toBe(true);
    expect(isStudentCourseComplete(makeCourse({ complianceStatus: 'expiring_soon' }))).toBe(false);
  });
});
