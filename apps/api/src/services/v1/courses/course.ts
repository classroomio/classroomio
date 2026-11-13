import type {
  TPublicApiCloneCourse,
  TPublicApiCourseParam,
  TPublicApiCoursesQuery,
  TPublicApiCreateCourse,
  TPublicApiPaginationQuery,
  TPublicApiRelatedCoursesQuery,
  TPublicApiUpdateCourse,
  TPublicApiUpdateCourseStructure
} from '@cio/utils/validation/public-api';
import type { TTag } from '@cio/db/types';

import { ROLE } from '@cio/utils/constants';
import { generateSlug } from '@cio/utils/functions';
import { getCourseById, isCourseSlugTaken } from '@cio/db/queries/course';
import {
  getCourseTagsByCourseIdsForOrganization,
  getCourseTagsForOrganization,
  getRelatedCourses
} from '@cio/db/queries/tag';
import {
  createCourse as createCourseService,
  deleteCourse as deleteCourseService,
  getCourse,
  updateCourse as updateCourseService
} from '@cio/core/services/course/course';
import type { UpdateCourseResult } from '@cio/core/services/course/course';
import { emitCoursePublishWebhookEvent } from '@cio/core/services/webhook/emit';
import { buildCourseOutline } from '@cio/core/services/course/utils';
import { getCourseGoLiveReadiness, publishCourseWhenReady } from '@cio/core/services/course/go-live-readiness';
import { buildCourseLinks, resolveCourseBanner } from '@cio/core/services/course/landing-page';
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
import {
  assertAutomationActor,
  assertCourseBelongsToOrganization,
  assertCourseTeamAccess,
  assertOrgTeamMember,
  assertProfileBelongsToOrganization
} from '@api/services/v1/shared';
import { assertCertificateChangeAllowed } from '@api/services/course/certificate-plan';
import { updateCourseWithTags } from '@api/services/course/update-course';

export async function listCoursesService(orgId: string, query: TPublicApiCoursesQuery) {
  return getOrganizationCourses(orgId, '', ROLE.ADMIN, query);
}

const toTagPreview = ({ id, name, slug, color }: TTag) => ({ id, name, slug, color });

export async function getCourseService(orgId: string, params: TPublicApiCourseParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const [course, tags] = await Promise.all([
    getCourse(params.courseId),
    getCourseTagsForOrganization(orgId, params.courseId)
  ]);
  const outline = buildCourseOutline(course.content);

  return { ...course, tags: tags.map(toTagPreview), content: { ...course.content, outline } };
}

export async function listRelatedCoursesService(
  orgId: string,
  params: TPublicApiCourseParam,
  query: TPublicApiRelatedCoursesQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  if (query.profileId) {
    await assertProfileBelongsToOrganization(orgId, query.profileId);
  }

  const sourceTags = await getCourseTagsForOrganization(orgId, params.courseId);
  if (sourceTags.length === 0) {
    return [];
  }

  const sourceTagIds = new Set(sourceTags.map((tag) => tag.id));
  const courses = await getRelatedCourses(orgId, params.courseId, [...sourceTagIds], {
    excludeProfileId: query.profileId,
    pricing: query.pricing,
    limit: query.limit
  });
  if (courses.length === 0) {
    return [];
  }

  const tagsByCourseId = await getCourseTagsByCourseIdsForOrganization(
    orgId,
    courses.map((course) => course.id)
  );

  return courses.map((course) => {
    const tags = tagsByCourseId[course.id] ?? [];
    const sharedTags = tags.filter((tag) => sourceTagIds.has(tag.id));
    return { ...course, tags, sharedTags };
  });
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

  await assertOrgTeamMember(orgId, actorId);

  const { bannerImageUrl, generateBannerImage, bannerImageQuery, ...courseFields } = payload;
  const created = await createCourseService(actorId, { ...courseFields, organizationId: orgId }, source);

  const banner = await resolveCourseBanner(created.course.title, {
    bannerImageUrl,
    generateBannerImage,
    bannerImageQuery
  });
  const course = banner.imageUrl
    ? (await updateCourseService(created.course.id, { bannerImage: banner.imageUrl })).course
    : created.course;
  const links = await buildCourseLinks(orgId, course);

  return { ...created, course, banner, ...links };
}

export async function publishPublicApiCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  const readiness = await getCourseGoLiveReadiness(params.courseId);
  if (!readiness.ready) {
    const [current] = await getCourseById(params.courseId);
    const links = await buildCourseLinks(orgId, current!);

    return {
      published: Boolean(current!.isPublished),
      course: current!,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
      ...links
    };
  }

  const result = await publishCourseWhenReady(params.courseId, actorId);
  const links = await buildCourseLinks(orgId, result.course);

  return {
    published: Boolean(result.course.isPublished),
    course: result.course,
    blockers: result.readiness.blockers,
    warnings: result.readiness.warnings,
    ...links
  };
}

export async function unpublishPublicApiCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  const { course, publishChange } = await updateCourseService(params.courseId, { isPublished: false });
  await emitCoursePublishWebhookEvent(params.courseId, publishChange, actorId);
  const links = await buildCourseLinks(orgId, course);

  return { course, ...links };
}

const toCourseTag = ({ id, name, slug, color }: TTag) => ({ id, name, slug, color });

export async function updatePublicApiCourseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiUpdateCourse
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertCertificateChangeAllowed(params.courseId, payload.certificate);

  const { tagIds, addTagIds, ...courseData } = payload;

  let updated: UpdateCourseResult & { tags: TTag[] };

  if (tagIds === undefined && addTagIds === undefined) {
    const result = await updateCourseService(params.courseId, courseData);
    const courseTags = await getCourseTagsForOrganization(orgId, params.courseId);
    updated = { ...result, tags: courseTags };
  } else {
    assertAutomationActor(actorId);

    updated = await updateCourseWithTags({
      courseId: params.courseId,
      courseData,
      orgId,
      updatedByUserId: actorId,
      ...(addTagIds ? { addTagIds } : { tagIds: tagIds! })
    });
  }

  const { course, conversionOffenders, publishedNow, publishChange, tags } = updated;
  await emitCoursePublishWebhookEvent(params.courseId, publishChange, actorId);

  return { course: { ...course, tags: tags.map(toCourseTag) }, conversionOffenders, publishedNow };
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
