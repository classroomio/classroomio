import type {
  TPublicApiEmailTemplateParam,
  TPublicApiEmailTemplateQuery,
  TPublicApiSaveEmailTemplate,
  TPublicApiSendTestEmailTemplate
} from '@cio/utils/validation/public-api';
import {
  STUDENT_EMAIL_CATALOG,
  STUDENT_EMAIL_IDS,
  STUDENT_EMAIL_LINKS,
  STUDENT_EMAIL_VARIABLES,
  type EmailLocale,
  type StudentEmailId
} from '@cio/utils/email';

import {
  listStudentEmailTemplates,
  resetStudentEmailTemplate,
  saveStudentEmailTemplate,
  sendStudentEmailTemplateTest
} from '@api/services/organization/student-email-templates';
import { assertOrgAdmin, paginateInMemory } from '../shared';

type TSavedEmailTemplate = { subject: string | null; content: string; isCustomized: boolean; updatedAt: string };

/** The saved template when there is one, otherwise the default copy, so callers never need the catalog. */
function toPublicEmailTemplateSummary(emailId: StudentEmailId, locale: EmailLocale, saved?: TSavedEmailTemplate) {
  return {
    emailId,
    locale,
    subject: saved?.subject ?? STUDENT_EMAIL_CATALOG[locale].templates[emailId].subject,
    isCustomized: saved?.isCustomized ?? false,
    updatedAt: saved?.updatedAt ?? null
  };
}

function toPublicEmailTemplate(emailId: StudentEmailId, locale: EmailLocale, saved?: TSavedEmailTemplate) {
  return {
    ...toPublicEmailTemplateSummary(emailId, locale, saved),
    content: saved?.content ?? STUDENT_EMAIL_CATALOG[locale].templates[emailId].body,
    variables: [...STUDENT_EMAIL_VARIABLES[emailId]],
    hasActionLink: Boolean(STUDENT_EMAIL_LINKS[emailId])
  };
}

async function getSavedEmailTemplate(orgId: string, emailId: StudentEmailId, locale: EmailLocale) {
  const saved = await listStudentEmailTemplates(orgId);

  return saved.find((template) => template.emailId === emailId && template.locale === locale);
}

export async function listEmailTemplatesService(
  orgId: string,
  actorId: string | null,
  query: TPublicApiEmailTemplateQuery
) {
  await assertOrgAdmin(orgId, actorId);

  const saved = (await listStudentEmailTemplates(orgId)).filter((template) => template.locale === query.locale);
  const templates = STUDENT_EMAIL_IDS.map((emailId) =>
    toPublicEmailTemplateSummary(
      emailId,
      query.locale,
      saved.find((template) => template.emailId === emailId)
    )
  );

  return paginateInMemory(templates, query);
}

export async function getEmailTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiEmailTemplateParam
) {
  await assertOrgAdmin(orgId, actorId);

  const saved = await getSavedEmailTemplate(orgId, params.emailId, params.locale);

  return toPublicEmailTemplate(params.emailId, params.locale, saved);
}

export async function saveEmailTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiEmailTemplateParam,
  payload: TPublicApiSaveEmailTemplate
) {
  await assertOrgAdmin(orgId, actorId);

  const saved = await saveStudentEmailTemplate({ organizationId: orgId, ...params, ...payload });

  return toPublicEmailTemplate(params.emailId, params.locale, saved);
}

/** Idempotent: resetting a template that was never saved still succeeds and returns the default. */
export async function resetEmailTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiEmailTemplateParam
) {
  await assertOrgAdmin(orgId, actorId);

  await resetStudentEmailTemplate(orgId, params.emailId, params.locale);

  return toPublicEmailTemplate(params.emailId, params.locale);
}

/** Omitted content or subject falls back to the current template, so a caller can test what is saved. */
export async function sendTestEmailTemplateService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiEmailTemplateParam,
  payload: TPublicApiSendTestEmailTemplate
) {
  await assertOrgAdmin(orgId, actorId);

  const saved = await getSavedEmailTemplate(orgId, params.emailId, params.locale);
  const current = toPublicEmailTemplate(params.emailId, params.locale, saved);

  return sendStudentEmailTemplateTest({
    organizationId: orgId,
    ...params,
    content: payload.content ?? current.content,
    subject: payload.subject ?? current.subject,
    recipientEmails: payload.recipientEmails
  });
}
