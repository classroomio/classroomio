import { deleteCourseContent, reorderCourseContent, updateCourseContent } from '@cio/core/services/course/content';
import { getCourseSectionsByCourseId } from '@cio/db/queries/course';
import type {
  TPublicApiCourseParam,
  TPublicApiDeleteCourseContent,
  TPublicApiReorderCourseContent,
  TPublicApiUpdateCourseContentLock
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseTeamAccess } from '../shared';

// The core checks the moved items but not the section they move into.
async function assertTargetSectionsInCourse(courseId: string, payload: TPublicApiReorderCourseContent) {
  const targetIds = (payload.items ?? []).flatMap((item) => (item.sectionId ? [item.sectionId] : []));
  if (targetIds.length === 0) return;

  const courseSectionIds = new Set((await getCourseSectionsByCourseId(courseId)).map((section) => section.id));
  if (targetIds.some((id) => !courseSectionIds.has(id))) {
    throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
  }
}

export async function reorderPublicApiCourseContentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiReorderCourseContent
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertTargetSectionsInCourse(params.courseId, payload);

  const result = await reorderCourseContent(params.courseId, payload);

  return {
    updatedSections: result.updatedSections,
    updatedLessons: result.updatedLessons,
    updatedExercises: result.updatedExercises
  };
}

export async function updatePublicApiCourseContentLockService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourseContentLock
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  await updateCourseContent(params.courseId, payload.items);

  return { items: payload.items };
}

export async function deletePublicApiCourseContentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiDeleteCourseContent
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  await deleteCourseContent(params.courseId, { items: payload.items });

  return { items: payload.items };
}
