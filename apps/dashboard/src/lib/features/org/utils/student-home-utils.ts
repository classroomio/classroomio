import { getLmsDestinationByPath, LMS_DESTINATIONS, type LmsAvailabilityContext } from '@cio/utils/lms';
import type { TStudentHomeDestination } from '@cio/utils/validation/organization';
import type { StudentHomeCourseOption } from './types';

export type StudentHomePageOption = {
  key: (typeof LMS_DESTINATIONS)[number]['key'];
  label: string;
  disabled: boolean;
  disabledReason: 'customization' | 'plan' | null;
};

export type StudentHomeWarning = 'unavailable' | 'course-missing';

/**
 * Maps stored student-home columns to the typed destination the picker edits.
 */
export function toStudentHomeDestination(
  org:
    | {
        studentHomePath?: string | null;
        studentHomeCourseId?: string | null;
      }
    | null
    | undefined
): TStudentHomeDestination | null {
  if (org?.studentHomeCourseId) {
    return { type: 'course', courseId: org.studentHomeCourseId };
  }

  if (org?.studentHomePath) {
    const page = getLmsDestinationByPath(org.studentHomePath);
    if (page) {
      return { type: 'page', key: page.key };
    }
  }

  return null;
}

/**
 * Builds the Learning-portal picker options with availability from the org context.
 */
export function buildStudentHomePageOptions(
  t: (key: string) => string,
  context: LmsAvailabilityContext
): StudentHomePageOption[] {
  return LMS_DESTINATIONS.map((destination) => {
    const disabledReason = destination.unavailableReason(context);

    return {
      key: destination.key,
      label: t(destination.titleKey),
      disabled: disabledReason !== null,
      disabledReason
    };
  });
}

/**
 * Reports when a saved destination silently falls back to Dashboard.
 */
export function getStudentHomeWarning(
  destination: TStudentHomeDestination | null,
  pageOptions: StudentHomePageOption[],
  courseOptions: StudentHomeCourseOption[] | null
): StudentHomeWarning | null {
  if (!destination) {
    return null;
  }

  if (destination.type === 'page') {
    return pageOptions.some((option) => option.key === destination.key && option.disabled) ? 'unavailable' : null;
  }

  if (!courseOptions) {
    return null;
  }

  const course = courseOptions.find((option) => option.id === destination.courseId);

  return course && !course.isAvailable ? 'course-missing' : null;
}
