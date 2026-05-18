import { defaultAiTutorSettings, mergeAiTutorSettings, type AiTutorSettings } from '@cio/ai-assistant/tutor-config';
import {
  getCourseAiTutorOverride,
  getOrgAiTutorSettings,
  updateCourseAiTutorOverride,
  updateOrgAiTutorSettings
} from '@cio/db/queries/agent';

import { AppError } from '@api/utils/errors';

/**
 * Resolved AI tutor settings for a given (org, course) pair.
 *
 * Merge order (later overrides earlier):
 *   defaultAiTutorSettings  →  org.aiTutorSettings  →  course.metadata.aiTutor
 *
 * If the course override has `inheritFromOrg !== false`, the org defaults apply
 * for every field the course did not explicitly set. The course can still flip
 * individual fields (including `enabled`).
 */
export async function getEffectiveAiTutorSettings(orgId: string, courseId: string): Promise<AiTutorSettings> {
  const [orgSettings, courseOverride] = await Promise.all([
    getOrgAiTutorSettings(orgId),
    getCourseAiTutorOverride(courseId)
  ]);

  const orgResolved = mergeAiTutorSettings(defaultAiTutorSettings, orgSettings as Partial<AiTutorSettings> | null);

  if (!courseOverride) return orgResolved;
  if (courseOverride.inheritFromOrg === true) return orgResolved;

  const { inheritFromOrg: _drop, ...override } = courseOverride;
  return mergeAiTutorSettings(orgResolved, override as Partial<AiTutorSettings>);
}

export async function getResolvedOrgAiTutorSettings(orgId: string): Promise<AiTutorSettings> {
  const orgSettings = await getOrgAiTutorSettings(orgId);
  return mergeAiTutorSettings(defaultAiTutorSettings, orgSettings as Partial<AiTutorSettings> | null);
}

export async function updateOrgAiTutorSettingsService(
  orgId: string,
  patch: Partial<AiTutorSettings>
): Promise<AiTutorSettings> {
  const updated = await updateOrgAiTutorSettings(orgId, patch);

  if (!updated) {
    throw new AppError('Organization not found', 'ORGANIZATION_NOT_FOUND', 404);
  }

  return mergeAiTutorSettings(defaultAiTutorSettings, updated as Partial<AiTutorSettings>);
}

export interface CourseAiTutorSettingsView {
  org: AiTutorSettings;
  override: (Partial<AiTutorSettings> & { inheritFromOrg?: boolean }) | null;
  effective: AiTutorSettings;
}

export async function getCourseAiTutorSettingsView(
  orgId: string,
  courseId: string
): Promise<CourseAiTutorSettingsView> {
  const [org, override, effective] = await Promise.all([
    getResolvedOrgAiTutorSettings(orgId),
    getCourseAiTutorOverride(courseId),
    getEffectiveAiTutorSettings(orgId, courseId)
  ]);

  return {
    org,
    override: (override as (Partial<AiTutorSettings> & { inheritFromOrg?: boolean }) | null) ?? null,
    effective
  };
}

export async function updateCourseAiTutorOverrideService(
  courseId: string,
  patch: Partial<AiTutorSettings> & { inheritFromOrg?: boolean }
): Promise<Partial<AiTutorSettings> & { inheritFromOrg?: boolean }> {
  const updated = await updateCourseAiTutorOverride(courseId, patch);

  if (!updated) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  return updated as Partial<AiTutorSettings> & { inheritFromOrg?: boolean };
}
