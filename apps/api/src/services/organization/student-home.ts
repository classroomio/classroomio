import { AppError, ErrorCodes } from '@api/utils/errors';
import { canProfileOpenCourse } from '@api/services/course/access';
import { env } from '@cio/core/config/env';
import {
  getOrganizationMemberRoleId,
  getOrganizationPlanStatus,
  getOrganizationStudentHome,
  getStudentHomeCourseCandidate,
  listStudentHomeCourseOptions,
  type StudentHomeCourseCandidate
} from '@cio/db/queries/organization';
import type { DbOrTxClient } from '@cio/db/drizzle';
import { ROLE } from '@cio/utils/constants';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
import {
  getLmsDestinationByKey,
  getLmsDestinationByPath,
  isLmsDestinationAvailable,
  LMS_FALLBACK_PATH,
  type LmsAvailabilityContext
} from '@cio/utils/lms';
import { isCoursePaid } from '@cio/utils/validation/course';
import type { TStudentHomeDestination } from '@cio/utils/validation/organization';

type StudentHomePricing = {
  cost: number | null;
  metadata: {
    allowSelfEnrollment?: boolean | null;
    allowNewStudent?: boolean | null;
    paymentEnabled?: boolean;
    paymentLink?: string | null;
  } | null;
};

function toStudentHomePricing(course: StudentHomeCourseCandidate): StudentHomePricing {
  return { cost: course.cost, metadata: course.metadata as StudentHomePricing['metadata'] };
}

/**
 * Whether a non-enrolled student may join the course for free in one click.
 */
export function canSelfEnrollForFree(course: StudentHomeCourseCandidate): boolean {
  const pricing = toStudentHomePricing(course);

  return isSelfEnrollmentAllowed(pricing.metadata) && !isCoursePaid(pricing.cost, pricing.metadata);
}

function toAvailabilityContext(
  orgId: string,
  plans: LmsAvailabilityContext['plans'],
  customization: LmsAvailabilityContext['customization']
): LmsAvailabilityContext {
  return {
    orgId,
    plans,
    isSelfHosted: env.PUBLIC_IS_SELFHOSTED === 'true',
    customization
  };
}

/**
 * Validates a submitted destination and maps it to the stored column pair.
 * Throws field-scoped 400s the settings form maps onto the control.
 */
export async function assertStudentHomeDestination(
  orgId: string,
  destination: TStudentHomeDestination | null,
  effectiveCustomization: LmsAvailabilityContext['customization'],
  dbClient: DbOrTxClient
): Promise<{ path: string | null; courseId: string | null }> {
  if (destination === null) {
    return { path: null, courseId: null };
  }

  if (destination.type === 'page') {
    const page = getLmsDestinationByKey(destination.key);
    const plans = await getOrganizationPlanStatus(orgId, dbClient);

    if (!page || !isLmsDestinationAvailable(page, toAvailabilityContext(orgId, plans, effectiveCustomization))) {
      throw new AppError(
        'This page is not available to students',
        ErrorCodes.STUDENT_HOME_UNAVAILABLE,
        400,
        'studentHome'
      );
    }

    return { path: page.path, courseId: null };
  }

  const course = await getStudentHomeCourseCandidate(orgId, destination.courseId, dbClient);

  if (!course || course.status !== 'ACTIVE' || !course.isPublished || course.isTemplate) {
    throw new AppError(
      'This course cannot be used as the student home',
      ErrorCodes.STUDENT_HOME_INVALID_COURSE,
      400,
      'studentHome'
    );
  }

  return { path: null, courseId: course.id };
}

/**
 * Resolves the stored student home to a redirect path for a profile.
 * Returns null when the landing page should render, never '/'.
 */
export async function resolveStudentHomePath(orgId: string, profileId: string): Promise<string | null> {
  const roleId = await getOrganizationMemberRoleId(orgId, profileId);
  if (roleId !== ROLE.STUDENT) {
    return null;
  }

  const home = await getOrganizationStudentHome(orgId);
  if (!home || (!home.studentHomePath && !home.studentHomeCourseId)) {
    return null;
  }

  if (home.studentHomePath) {
    const page = getLmsDestinationByPath(home.studentHomePath);

    return page &&
      isLmsDestinationAvailable(
        page,
        toAvailabilityContext(orgId, home.plans, home.customization as LmsAvailabilityContext['customization'])
      )
      ? page.path
      : LMS_FALLBACK_PATH;
  }

  const course = await getStudentHomeCourseCandidate(orgId, home.studentHomeCourseId as string);
  if (!course || course.status !== 'ACTIVE' || !course.isPublished || course.isTemplate) {
    return LMS_FALLBACK_PATH;
  }

  if (await canProfileOpenCourse(course.id, profileId)) {
    return `/courses/${course.id}/lessons?next=true`;
  }

  if (course.type === 'PUBLIC' && course.slug) {
    return `/course/${course.slug}`;
  }

  if (course.slug && canSelfEnrollForFree(course)) {
    return `/course/${course.slug}/enroll?from=student-home`;
  }

  return LMS_FALLBACK_PATH;
}

export type StudentHomeCourseOption = {
  id: string;
  title: string;
  type: string | null;
  isAvailable: boolean;
  canSelfEnroll: boolean;
};

/**
 * Lists the course options for the settings picker with availability flags.
 */
export async function listStudentHomeOptions(
  orgId: string,
  query: { search?: string; includeCourseId?: string }
): Promise<StudentHomeCourseOption[]> {
  const rows = await listStudentHomeCourseOptions(orgId, query);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    isAvailable: row.status === 'ACTIVE' && row.isPublished === true && !row.isTemplate,
    canSelfEnroll: canSelfEnrollForFree(row)
  }));
}
