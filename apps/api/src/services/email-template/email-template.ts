import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createOrganizationEmailTemplateAudit,
  deleteOrganizationEmailTemplate,
  getOrganizationEmailTemplate,
  getResolvedOrganizationEmailTemplate,
  listOrganizationEmailTemplates,
  upsertOrganizationEmailTemplate
} from '@cio/db/queries/email-template';
import { EmailRegistry, getEmailTemplateCatalog, type ResolvedEmailTemplateOverride } from '@cio/email';
import { applyDefaultTemplateOverrides } from '@cio/email';
import {
  DEFAULT_EMAIL_TEMPLATE_LOCALE,
  REQUIRED_EMAIL_TEMPLATE_IDS,
  type TEmailTemplateId,
  type TEmailTemplateLocale
} from '@cio/utils/constants';
import type {
  TDeleteEmailTemplate,
  TListEmailTemplatesQuery,
  TPreviewEmailTemplate,
  TUpsertEmailTemplate
} from '@cio/utils/validation/email-template';

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const REQUIRED_EMAIL_TEMPLATE_ID_SET = new Set<TEmailTemplateId>(REQUIRED_EMAIL_TEMPLATE_IDS);

interface EmailTemplateCatalogLookup {
  id: TEmailTemplateId;
  subject: string;
  placeholders: string[];
  requiredPlaceholders: string[];
  isRequiredTemplate: boolean;
}

function getCatalogItem(emailId: TEmailTemplateId): EmailTemplateCatalogLookup {
  const catalogItem = getEmailTemplateCatalog().find((item) => item.id === emailId);
  if (!catalogItem) {
    throw new AppError('Email template definition not found', ErrorCodes.NOT_FOUND, 404, 'emailId');
  }

  return catalogItem as EmailTemplateCatalogLookup;
}

function extractTemplatePlaceholders(content: string): string[] {
  PLACEHOLDER_REGEX.lastIndex = 0;
  const placeholders = new Set<string>();
  let match = PLACEHOLDER_REGEX.exec(content);

  while (match !== null) {
    const key = match[1]?.trim();
    if (key) {
      placeholders.add(key);
    }
    match = PLACEHOLDER_REGEX.exec(content);
  }

  return Array.from(placeholders);
}

function assertValidTemplateContent(emailId: TEmailTemplateId, content: string): void {
  const catalog = getCatalogItem(emailId);
  const usedPlaceholders = extractTemplatePlaceholders(content);

  const unknownPlaceholders = usedPlaceholders.filter((placeholder) => !catalog.placeholders.includes(placeholder));
  if (unknownPlaceholders.length > 0) {
    const formatted = unknownPlaceholders.map((key) => `{{${key}}}`).join(', ');
    throw new AppError(`Unknown placeholders found: ${formatted}`, ErrorCodes.VALIDATION_ERROR, 400, 'content');
  }

  const missingRequiredPlaceholders = catalog.requiredPlaceholders.filter(
    (requiredPlaceholder) => !usedPlaceholders.includes(requiredPlaceholder)
  );
  if (missingRequiredPlaceholders.length > 0) {
    const formatted = missingRequiredPlaceholders.map((key) => `{{${key}}}`).join(', ');
    throw new AppError(`Missing required placeholders: ${formatted}`, ErrorCodes.VALIDATION_ERROR, 400, 'content');
  }
}

function getPreviewFieldValue(placeholder: string): string {
  const normalized = placeholder.toLowerCase();
  if (normalized.includes('link') || normalized.includes('url')) return 'https://example.com';
  if (normalized.includes('email')) return 'user@example.com';
  if (normalized.includes('name')) return 'Jane Doe';
  if (normalized.includes('expires')) return 'Jan 1, 2030 00:00 UTC';
  if (normalized.includes('course')) return 'Sample Course';
  if (normalized.includes('org')) return 'Sample Organization';
  if (normalized.includes('status')) return 'Graded';
  if (normalized.includes('score')) return '8';
  if (normalized.includes('max')) return '10';
  return `Sample ${placeholder}`;
}

function buildPreviewFields(placeholders: string[]): Record<string, string> {
  return placeholders.reduce<Record<string, string>>((acc, key) => {
    acc[key] = getPreviewFieldValue(key);
    return acc;
  }, {});
}

export async function listEmailTemplatesService(organizationId: string, filters: TListEmailTemplatesQuery) {
  const templates = await listOrganizationEmailTemplates(organizationId, filters);
  const catalog = getEmailTemplateCatalog();

  return {
    templates,
    catalog
  };
}

export async function getEmailTemplateService(
  organizationId: string,
  emailId: TEmailTemplateId,
  locale: TEmailTemplateLocale = DEFAULT_EMAIL_TEMPLATE_LOCALE
) {
  const [template, resolved, catalog] = await Promise.all([
    getOrganizationEmailTemplate(organizationId, emailId, locale),
    getResolvedOrganizationEmailTemplate(organizationId, emailId, locale),
    Promise.resolve(getCatalogItem(emailId))
  ]);

  return {
    emailId,
    locale,
    template,
    resolvedTemplate: resolved.template,
    resolvedLocale: resolved.resolvedLocale,
    fallbackUsed: resolved.fallbackUsed,
    catalog
  };
}

export async function upsertEmailTemplateService(
  organizationId: string,
  emailId: TEmailTemplateId,
  data: TUpsertEmailTemplate,
  actorProfileId: string
) {
  const locale = data.locale ?? DEFAULT_EMAIL_TEMPLATE_LOCALE;

  if (data.isEnabled === false && REQUIRED_EMAIL_TEMPLATE_ID_SET.has(emailId)) {
    throw new AppError('This email template is required and cannot be disabled', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (data.content !== undefined && data.content !== null) {
    assertValidTemplateContent(emailId, data.content);
  }

  const before = await getOrganizationEmailTemplate(organizationId, emailId, locale);

  const updatedTemplate = await upsertOrganizationEmailTemplate({
    organizationId,
    emailId,
    locale,
    isEnabled: data.isEnabled,
    logoUrl: data.logoUrl,
    content: data.content,
    updatedByProfileId: actorProfileId
  });

  const action = !before
    ? 'CREATED'
    : before.isEnabled !== updatedTemplate.isEnabled
      ? updatedTemplate.isEnabled
        ? 'ENABLED'
        : 'DISABLED'
      : 'UPDATED';

  await createOrganizationEmailTemplateAudit({
    organizationId,
    emailTemplateId: updatedTemplate.id,
    action,
    before: before ?? {},
    after: updatedTemplate,
    actorProfileId
  });

  return updatedTemplate;
}

export async function deleteEmailTemplateService(
  organizationId: string,
  emailId: TEmailTemplateId,
  data: TDeleteEmailTemplate,
  actorProfileId: string
) {
  const locale = data.locale ?? DEFAULT_EMAIL_TEMPLATE_LOCALE;
  const deletedTemplate = await deleteOrganizationEmailTemplate(organizationId, emailId, locale);

  if (!deletedTemplate) {
    throw new AppError('Email template not found', ErrorCodes.NOT_FOUND, 404);
  }

  await createOrganizationEmailTemplateAudit({
    organizationId,
    emailTemplateId: deletedTemplate.id,
    action: 'DELETED',
    before: deletedTemplate,
    after: {},
    actorProfileId
  });

  return deletedTemplate;
}

export async function previewEmailTemplateService(emailId: TEmailTemplateId, data: TPreviewEmailTemplate) {
  if (data.content !== undefined && data.content !== null) {
    assertValidTemplateContent(emailId, data.content);
  }

  const catalogItem = getCatalogItem(emailId);
  const template = EmailRegistry.get(emailId);

  if (!template) {
    throw new AppError('Email template renderer not found', ErrorCodes.NOT_FOUND, 404, 'emailId');
  }

  const fields = buildPreviewFields(catalogItem.placeholders);
  const defaultHtml = template.render(fields as never);
  const html = applyDefaultTemplateOverrides(defaultHtml, {
    content: data.content,
    logoUrl: data.logoUrl,
    fields
  });

  return {
    emailId,
    locale: data.locale ?? DEFAULT_EMAIL_TEMPLATE_LOCALE,
    subject: template.subject,
    html,
    placeholders: catalogItem.placeholders,
    requiredPlaceholders: catalogItem.requiredPlaceholders
  };
}

export async function resolveEmailTemplateForSendService(input: {
  organizationId: string;
  emailId: TEmailTemplateId;
  locale?: TEmailTemplateLocale;
}): Promise<ResolvedEmailTemplateOverride | null> {
  const resolved = await getResolvedOrganizationEmailTemplate(
    input.organizationId,
    input.emailId,
    input.locale ?? DEFAULT_EMAIL_TEMPLATE_LOCALE
  );

  if (!resolved.template) {
    return null;
  }

  return {
    isEnabled: resolved.template.isEnabled,
    logoUrl: resolved.template.logoUrl,
    content: resolved.template.content
  };
}
