import type { EmailTemplateCatalogItem, OrganizationEmailTemplateOverride } from '$features/email-template/utils/types';
import type { TEmailTemplateId, TEmailTemplateLocale } from '@cio/utils/constants';

export function getTemplateOverrideForLocale(
  templates: OrganizationEmailTemplateOverride[],
  emailId: TEmailTemplateId,
  locale: TEmailTemplateLocale
): OrganizationEmailTemplateOverride | null {
  return templates.find((template) => template.emailId === emailId && template.locale === locale) ?? null;
}

export function formatEmailTemplateId(emailId: string): string {
  return emailId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

export function sortCatalogByLabel(catalog: EmailTemplateCatalogItem[]): EmailTemplateCatalogItem[] {
  return [...catalog].sort((a, b) => formatEmailTemplateId(a.id).localeCompare(formatEmailTemplateId(b.id)));
}
