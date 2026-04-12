import type {
  TPublicApiCourseParam,
  TPublicApiCoursesQuery,
  TPublicApiCreateCourse,
  TPublicApiUpdateCourse,
  TPublicApiUpdateCourseStructure
} from '@cio/utils/validation/public-api';

import { ROLE } from '@cio/utils/constants';
import {
  createCourse as createCourseService,
  deleteCourse as deleteCourseService,
  getCourse,
  updateCourse as updateCourseService
} from '@api/services/course/course';
import {
  createCourseImportDraftService,
  getCourseImportStructureService,
  publishCourseImportDraftToExistingCourseService
} from '@api/services/course-import/course-import';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationCourses } from '@api/services/organization';
import { listCourseMembers } from '@api/services/course/people';
import { AppError, ErrorCodes } from '@api/utils/errors';

async function assertCourseBelongsToOrganization(orgId: string, courseId: string): Promise<void> {
  const courseOrganizationId = await getCourseOrganizationId(courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

export async function listCoursesService(orgId: string, query: TPublicApiCoursesQuery) {
  const result = await getOrganizationCourses(orgId, '', ROLE.ADMIN, {
    page: 1,
    limit: 100,
    search: undefined,
    tags: query.tags
  });

  return result.items;
}

export async function getCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return getCourse(params.courseId);
}

export async function listCourseStudentsService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const members = await listCourseMembers(params.courseId);
  return members.filter((member) => member.roleId === ROLE.STUDENT);
}

export async function exportCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return getCourseImportStructureService(orgId, params.courseId);
}

export async function createPublicApiCourseService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateCourse
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return createCourseService(actorId, {
    ...payload,
    organizationId: orgId
  });
}

export async function updatePublicApiCourseService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourse
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return updateCourseService(params.courseId, payload);
}

export async function deletePublicApiCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return deleteCourseService(params.courseId);
}

export async function updatePublicApiCourseStructureService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourseStructure
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const draft = await createCourseImportDraftService(orgId, actorId, {
    sourceType: 'course',
    idempotencyKey: payload.idempotencyKey,
    summary: {
      sourceCourseId: params.courseId,
      syncMode: payload.mode,
      ...(payload.summary ?? {})
    },
    sourceArtifacts: [
      {
        type: 'course',
        courseId: params.courseId,
        label: payload.draft.course.title
      },
      ...(payload.sourceArtifacts ?? [])
    ],
    draft: payload.draft
  });

  const result = await publishCourseImportDraftToExistingCourseService(orgId, draft.id, {
    courseId: params.courseId,
    syncMode: payload.mode
  });

  return {
    draftId: draft.id,
    syncMode: payload.mode,
    ...result
  };
}
