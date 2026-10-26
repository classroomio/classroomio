import type {
  TPublicApiCloneCourse,
  TPublicApiCourseParam,
  TPublicApiCoursesQuery,
  TPublicApiCreateCourse,
  TPublicApiPaginationQuery,
  TPublicApiUpdateCourse,
  TPublicApiUpdateCourseStructure
} from '@cio/utils/validation/public-api';

import { ROLE } from '@cio/utils/constants';
import { generateSlug } from '@cio/utils/functions';
import { getCourseById, isCourseSlugTaken } from '@cio/db/queries/course';
import {
  createCourse as createCourseService,
  deleteCourse as deleteCourseService,
  getCourse,
  updateCourse as updateCourseService
} from '@cio/core/services/course/course';
import { emitCoursePublishWebhookEvent } from '@cio/core/services/webhook/emit';
import { buildCourseOutline } from '@cio/core/services/course/utils';
import type { TEventSource } from '@cio/core/services/posthog';
import {
  createCourseImportDraftService,
  getCourseImportStructureService,
  publishCourseImportDraftToExistingCourseService
} from '@api/services/course-import/course-import';
import { getOrganizationCourses } from '@api/services/organization';
import { cloneCourse } from '@api/services/course/clone';
import { listPaginatedCourseMembers } from '@api/services/course/people';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor, assertCourseBelongsToOrganization, assertOrgTeamMember } from '@api/services/v1/shared';
import { assertCertificateChangeAllowed } from '@api/services/course/certificate-plan';

export async function listCoursesService(orgId: string, query: TPublicApiCoursesQuery) {
  return getOrganizationCourses(orgId, '', ROLE.ADMIN, query);
}

export async function getCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const course = await getCourse(params.courseId);
  const outline = buildCourseOutline(course.content);

  return { ...course, content: { ...course.content, outline } };
}

export async function listCourseStudentsService(
  orgId: string,
  params: TPublicApiCourseParam,
  query: TPublicApiPaginationQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return listPaginatedCourseMembers(params.courseId, {
    page: query.page,
    limit: query.limit,
    roleId: ROLE.STUDENT
  });
}

export async function exportCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return getCourseImportStructureService(orgId, params.courseId);
}

export async function createPublicApiCourseService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateCourse,
  source: TEventSource = 'public_api'
) {
  if (!actorId) {
    throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  return createCourseService(
    actorId,
    {
      ...payload,
      organizationId: orgId
    },
    source
  );
}

export async function updatePublicApiCourseService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourse,
  actorId: string | null = null
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCertificateChangeAllowed(params.courseId, payload.certificate);

  const result = await updateCourseService(params.courseId, payload);
  await emitCoursePublishWebhookEvent(params.courseId, result.publishChange, actorId);

  return result;
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

/**
 * Mirrors `POST /course/:courseId/clone` (`orgTeamMemberMiddleware`, `ZCourseClone`): the actor must be an org admin or
 * tutor and becomes the copy's tutor.
 */
export async function clonePublicApiCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiCloneCourse
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertOrgTeamMember(orgId, actorId);

  const [sourceCourse] = await getCourseById(params.courseId);
  if (!sourceCourse || sourceCourse.status === 'DELETED') {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (sourceCourse.isTemplate) {
    throw new AppError('Templates are copied with Use template', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }

  const slug = payload.slug ?? generateSlug(payload.title, { appendTimestamp: true });
  if (await isCourseSlugTaken(slug)) {
    throw new AppError('Slug is already in use', ErrorCodes.SLUG_IN_USE, 409, 'slug');
  }

  return cloneCourse(params.courseId, {
    title: payload.title,
    description: payload.description,
    slug,
    userId: actorId,
    organizationId: orgId
  });
}
