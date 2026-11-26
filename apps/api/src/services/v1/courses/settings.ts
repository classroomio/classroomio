import { getCourseById, mergeCourseMetadata } from '@cio/db/queries/course';
import type { TCourse } from '@cio/db/types';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions/course-enrollment';
import type {
  TPublicApiCourseParam,
  TPublicApiCourseSettingsResponse,
  TPublicApiUpdateCourseSettings
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseTeamAccess } from '../shared';

/** Effective values, with the same defaults the dashboard settings page applies to missing keys. */
function toCourseSettings(metadata: TCourse['metadata'] | null | undefined): TPublicApiCourseSettingsResponse {
  return {
    progressionMode: metadata?.progressionMode === 'sequential' ? 'sequential' : 'free',
    allowSelfEnrollment: isSelfEnrollmentAllowed(metadata),
    allowMarkdownExport: metadata?.allowMarkdownExport ?? false,
    commentsEnabled: metadata?.commentsEnabled !== false
  };
}

async function getCourseOrThrow(courseId: string) {
  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return course;
}

export async function getPublicApiCourseSettingsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const course = await getCourseOrThrow(params.courseId);

  return toCourseSettings(course.metadata);
}

export async function updatePublicApiCourseSettingsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourseSettings
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const course = await getCourseOrThrow(params.courseId);

  if (payload.allowSelfEnrollment && course.isPrivate) {
    throw new AppError('A private course cannot allow self-enrollment', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const patch = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  const updated = await mergeCourseMetadata(params.courseId, patch);
  if (!updated) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return toCourseSettings(updated.metadata);
}
