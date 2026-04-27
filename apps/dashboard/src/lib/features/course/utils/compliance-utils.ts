import type { TCourseType } from '@cio/db/types';
import type { TComplianceSettings } from '@cio/utils/validation/course';
import type { UserEnrolledCourses } from '$features/course/types';

export const DEFAULT_COMPLIANCE_SETTINGS = {
  retakeIntervalMonths: 12,
  gracePeriodDays: 0,
  reminderDaysBefore: [30, 7, 1],
  isMandatory: true,
  framework: null,
  maxRetakeAttempts: null,
  passingScore: 80
} satisfies TComplianceSettings;

export function isSelfPacedLikeCourse(courseType: TCourseType | null | undefined): boolean {
  return courseType === 'SELF_PACED' || courseType === 'COMPLIANCE';
}

type StudentComplianceStatus =
  | 'not_started'
  | 'in_progress'
  | 'compliant'
  | 'expiring_soon'
  | 'in_grace_period'
  | 'non_compliant'
  | 'waived'
  | null
  | undefined;

type StudentEnrolledCourse = UserEnrolledCourses[number];

function getCourseContentProgress(course: StudentEnrolledCourse) {
  const exercisesCompleted = typeof course.exercisesCompleted === 'number' ? course.exercisesCompleted : 0;
  const totalExercises = typeof course.exerciseCount === 'number' ? course.exerciseCount : 0;
  const totalItems = (course.lessonCount ?? 0) + totalExercises;

  if (totalItems <= 0) {
    return 0;
  }

  const completedItems = (course.progressRate ?? 0) + exercisesCompleted;
  return Math.round((completedItems / totalItems) * 100);
}

export function getStudentCourseComplianceStatus(course: StudentEnrolledCourse): StudentComplianceStatus {
  if (course.type !== 'COMPLIANCE') {
    return null;
  }

  if (!('complianceStatus' in course)) {
    return null;
  }

  return course.complianceStatus as StudentComplianceStatus;
}

export function isStudentCourseComplete(course: StudentEnrolledCourse) {
  if (course.type === 'COMPLIANCE') {
    const complianceStatus = getStudentCourseComplianceStatus(course);
    return complianceStatus === 'compliant' || complianceStatus === 'waived';
  }

  return getCourseContentProgress(course) >= 100;
}

export function getStudentCourseProgressPercent(course: StudentEnrolledCourse) {
  return getCourseContentProgress(course);
}

export function getStudentCourseComplianceDate(course: StudentEnrolledCourse) {
  if (course.type !== 'COMPLIANCE') {
    return null;
  }

  const complianceStatus = getStudentCourseComplianceStatus(course);
  const validUntil = 'complianceValidUntil' in course ? (course.complianceValidUntil ?? null) : null;
  const dueDate = 'complianceDueDate' in course ? (course.complianceDueDate ?? null) : null;

  if ((complianceStatus === 'compliant' || complianceStatus === 'waived') && validUntil) {
    return {
      labelKey: 'courses.course_card.valid_until',
      value: validUntil
    };
  }

  if (dueDate) {
    return {
      labelKey: 'courses.course_card.due_date',
      value: dueDate
    };
  }

  return null;
}

export function getStudentCourseComplianceStatusKey(course: StudentEnrolledCourse) {
  const complianceStatus = getStudentCourseComplianceStatus(course);
  return complianceStatus ? `course.navItem.compliance.status.${complianceStatus}` : null;
}

export function getStudentCourseComplianceStatusVariant(course: StudentEnrolledCourse) {
  const complianceStatus = getStudentCourseComplianceStatus(course);
  if (!complianceStatus) {
    return 'outline';
  }

  if (complianceStatus === 'compliant') {
    return 'success';
  }

  if (
    complianceStatus === 'expiring_soon' ||
    complianceStatus === 'in_progress' ||
    complianceStatus === 'in_grace_period'
  ) {
    return 'warning';
  }

  if (complianceStatus === 'non_compliant') {
    return 'destructive';
  }

  if (complianceStatus === 'waived') {
    return 'secondary';
  }

  return 'outline';
}
