import { z } from 'zod';

import { DEFAULT_EMAIL_TEMPLATE_LOCALE, EMAIL_TEMPLATE_IDS, EMAIL_TEMPLATE_LOCALES } from '@cio/utils/constants';

const ZEmailTemplateId = z.enum(EMAIL_TEMPLATE_IDS);
const ZEmailTemplateLocale = z.enum(EMAIL_TEMPLATE_LOCALES);

export const ZListEmailTemplatesQuery = z.object({
  emailId: ZEmailTemplateId.optional(),
  locale: ZEmailTemplateLocale.optional()
});

export type TListEmailTemplatesQuery = z.infer<typeof ZListEmailTemplatesQuery>;

export const ZGetEmailTemplateParams = z.object({
  emailId: ZEmailTemplateId
});

export type TGetEmailTemplateParams = z.infer<typeof ZGetEmailTemplateParams>;

export const ZEmailTemplateLocaleQuery = z.object({
  locale: ZEmailTemplateLocale.default(DEFAULT_EMAIL_TEMPLATE_LOCALE)
});

export type TEmailTemplateLocaleQuery = z.infer<typeof ZEmailTemplateLocaleQuery>;

export const ZUpsertEmailTemplate = z.object({
  locale: ZEmailTemplateLocale.default(DEFAULT_EMAIL_TEMPLATE_LOCALE),
  isEnabled: z.boolean().optional(),
  logoUrl: z.url().nullable().optional(),
  content: z.string().nullable().optional()
});

export type TUpsertEmailTemplate = z.infer<typeof ZUpsertEmailTemplate>;

export const ZDeleteEmailTemplate = z.object({
  locale: ZEmailTemplateLocale.default(DEFAULT_EMAIL_TEMPLATE_LOCALE)
});

export type TDeleteEmailTemplate = z.infer<typeof ZDeleteEmailTemplate>;

export const ZPreviewEmailTemplate = z.object({
  locale: ZEmailTemplateLocale.default(DEFAULT_EMAIL_TEMPLATE_LOCALE),
  logoUrl: z.url().nullable().optional(),
  content: z.string().nullable().optional()
});

export type TPreviewEmailTemplate = z.infer<typeof ZPreviewEmailTemplate>;
