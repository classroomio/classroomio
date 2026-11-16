import { readMathNotationSettings, resolveMathNotation, type MathNotationSettings } from '@cio/question-types';
import {
  getCourseMathNotationOverride,
  getOrgMathNotation,
  updateCourseMathNotationOverride,
  updateOrgMathNotation
} from '@cio/db/queries/organization';
import { getOrgIdByCourseId } from '@cio/db/queries/course';
import type { TCourseMathNotationOverride, TMathNotationSettings } from '@cio/utils/validation/math';

import { AppError } from '@api/utils/errors';

/** The notation in force for a course, resolved from the organisation and the course override in the database. */
export async function getEffectiveMathNotation(courseId: string): Promise<MathNotationSettings> {
  const orgId = await getOrgIdByCourseId(courseId);
  const [orgSettings, courseOverride] = await Promise.all([
    orgId ? getOrgMathNotation(orgId) : null,
    getCourseMathNotationOverride(courseId)
  ]);

  return resolveMathNotation(orgSettings, courseOverride);
}

export async function getOrgMathNotationService(orgId: string): Promise<MathNotationSettings> {
  return readMathNotationSettings(await getOrgMathNotation(orgId));
}

export async function updateOrgMathNotationService(
  orgId: string,
  settings: TMathNotationSettings
): Promise<MathNotationSettings> {
  const updated = await updateOrgMathNotation(orgId, settings);
  if (!updated) throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);

  return readMathNotationSettings(updated);
}

export async function getCourseMathNotationView(orgId: string, courseId: string) {
  const [org, override, effective] = await Promise.all([
    getOrgMathNotationService(orgId),
    getCourseMathNotationOverride(courseId),
    getEffectiveMathNotation(courseId)
  ]);

  return { org, override: override as TCourseMathNotationOverride | null, effective };
}

export async function updateCourseMathNotationService(
  courseId: string,
  override: TCourseMathNotationOverride
): Promise<TCourseMathNotationOverride> {
  const updated = await updateCourseMathNotationOverride(courseId, override);
  if (!updated) throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);

  return updated as TCourseMathNotationOverride;
}
