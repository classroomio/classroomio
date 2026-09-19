import type {
  TPublicApiCourseParam,
  TPublicApiCreateSection,
  TPublicApiPromoteUngroupedSection,
  TPublicApiReorderSections,
  TPublicApiSectionParam,
  TPublicApiUpdateSection
} from '@cio/utils/validation/public-api';

import {
  createCourseSection,
  deleteCourseSectionService,
  listCourseSections,
  promoteUngroupedSection,
  reorderCourseSections,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import {
  assertCourseBelongsToOrganization,
  assertSectionBelongsToCourse,
  assertSectionsBelongToCourse
} from '@api/services/v1/shared';

export async function listPublicApiSectionsService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return listCourseSections(params.courseId);
}

export async function createPublicApiSectionService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiCreateSection
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return createCourseSection(params.courseId, { ...payload, courseId: params.courseId });
}

export async function promoteUngroupedPublicApiSectionService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiPromoteUngroupedSection
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return promoteUngroupedSection(params.courseId, payload);
}

export async function reorderPublicApiSectionsService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiReorderSections
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertSectionsBelongToCourse(
    params.courseId,
    payload.sections.map((section) => section.id)
  );

  return reorderCourseSections(payload.sections);
}

export async function updatePublicApiSectionService(
  orgId: string,
  params: TPublicApiSectionParam,
  payload: TPublicApiUpdateSection
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertSectionBelongsToCourse(params.courseId, params.sectionId);

  return updateCourseSectionService(params.sectionId, payload);
}

export async function deletePublicApiSectionService(orgId: string, params: TPublicApiSectionParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertSectionBelongsToCourse(params.courseId, params.sectionId);

  return deleteCourseSectionService(params.sectionId);
}
