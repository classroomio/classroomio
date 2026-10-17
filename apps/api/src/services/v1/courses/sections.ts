import {
  createCourseSection,
  listCourseSections,
  promoteUngroupedSection,
  updateCourseSectionService
} from '@cio/core/services/course/section';
import { deleteCourseContent } from '@cio/core/services/course/content';
import type { TCourseSection } from '@cio/db/types';
import type {
  TPublicApiCourseParam,
  TPublicApiCourseSectionParam,
  TPublicApiCourseSectionsQuery,
  TPublicApiCreateCourseSection,
  TPublicApiUpdateCourseSection
} from '@cio/utils/validation/public-api';
import { assertCourseTeamAccess, assertSectionInCourse, paginateInMemory } from '../shared';

function toPublicSection(section: TCourseSection) {
  return {
    id: section.id,
    courseId: section.courseId,
    title: section.title,
    order: section.order,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt
  };
}

export async function listPublicApiCourseSectionsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseSectionsQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  const sections = await listCourseSections(params.courseId);
  sections.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const page = paginateInMemory(sections, query);
  return { items: page.items.map(toPublicSection), pagination: page.pagination };
}

export async function createPublicApiCourseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiCreateCourseSection
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  if (payload.moveUngrouped) {
    const result = await promoteUngroupedSection(params.courseId, { title: payload.title });
    return {
      ...toPublicSection(result.section),
      movedLessons: result.movedLessons,
      movedExercises: result.movedExercises
    };
  }

  const section = await createCourseSection(params.courseId, {
    title: payload.title,
    order: payload.order!,
    courseId: params.courseId
  });
  return { ...toPublicSection(section), movedLessons: 0, movedExercises: 0 };
}

export async function updatePublicApiCourseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSectionParam,
  payload: TPublicApiUpdateCourseSection
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertSectionInCourse(params.courseId, params.sectionId);

  return toPublicSection(await updateCourseSectionService(params.sectionId, payload));
}

export async function deletePublicApiCourseSectionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseSectionParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const section = await assertSectionInCourse(params.courseId, params.sectionId);

  // Same path as the dashboard: also deletes the section's lessons and exercises.
  await deleteCourseContent(params.courseId, { sectionId: params.sectionId });

  return toPublicSection(section);
}
