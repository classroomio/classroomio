import type {
  TPublicApiCourseParam,
  TPublicApiCourseTemplateParam,
  TPublicApiCourseTemplatesQuery,
  TPublicApiCreateCourseFromTemplate,
  TPublicApiSaveCourseTemplate
} from '@cio/utils/validation/public-api';
import {
  createCourseFromTemplate,
  getCourseTemplatePreview,
  listCourseTemplates,
  saveCourseAsTemplate
} from '@api/services/course/course-template';
import { assertAutomationActor, assertOrgAdmin, assertOrgTeamMember, paginateInMemory } from '../shared';

/** Mirrors `GET /course/template`: org admins and tutors. Org templates come first, then global ones. */
export async function listCourseTemplatesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiCourseTemplatesQuery
) {
  await assertOrgTeamMember(orgId, actorId);

  const { org, global } = await listCourseTemplates(orgId);
  const templates = [
    ...(query.source === 'global' ? [] : org.map((card) => ({ ...card, source: 'org' as const }))),
    ...(query.source === 'org' ? [] : global.map((card) => ({ ...card, source: 'global' as const })))
  ];

  return paginateInMemory(templates, query);
}

/** Mirrors `GET /course/template/:templateId/preview`: org admins and tutors. */
export async function getCourseTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseTemplateParam
) {
  await assertOrgTeamMember(orgId, actorId);

  const { global, ...preview } = await getCourseTemplatePreview(params.templateId, orgId);

  return { ...preview, source: global ? ('global' as const) : ('org' as const) };
}

/** Mirrors `POST /course/template/:templateId/course` (`orgAdminMiddleware`): org admins only. */
export async function createCourseFromTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseTemplateParam,
  payload: TPublicApiCreateCourseFromTemplate
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return createCourseFromTemplate(params.templateId, orgId, actorId, payload.title);
}

/** Mirrors `POST /course/:courseId/template` (`orgAdminMiddleware`): org admins only, within the plan's template limit. */
export async function saveCourseAsTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiSaveCourseTemplate
) {
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);

  return saveCourseAsTemplate(params.courseId, orgId, actorId, payload.title);
}
