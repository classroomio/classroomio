import * as z from 'zod';

import { EMAIL_LOCALES, STUDENT_EMAIL_IDS } from '../../email';
import { ZPublicApiPaginationQuery } from './pagination';

const ZPublicApiEmailLocale = z.enum(EMAIL_LOCALES);

export const ZPublicApiEmailTemplateParam = z.object({
  emailId: z.enum(STUDENT_EMAIL_IDS).describe('Which student email, as listed by GET /organization/email-templates'),
  locale: ZPublicApiEmailLocale.describe('Language of the template')
});
export type TPublicApiEmailTemplateParam = z.infer<typeof ZPublicApiEmailTemplateParam>;

export const ZPublicApiEmailTemplateQuery = ZPublicApiPaginationQuery.extend({
  locale: ZPublicApiEmailLocale.default('en').describe('Language of the templates to list. Default: en.')
});
export type TPublicApiEmailTemplateQuery = z.infer<typeof ZPublicApiEmailTemplateQuery>;

const TEMPLATE_CONTENT_DESCRIPTION =
  "HTML body using only the template's {{placeholders}}; an {{action_url}} link only when hasActionLink is true.";

export const ZPublicApiSaveEmailTemplate = z.object({
  content: z.string().min(1).max(50_000).describe(TEMPLATE_CONTENT_DESCRIPTION),
  subject: z
    .string()
    .min(1)
    .max(200)
    .nullable()
    .optional()
    .describe(
      'Subject line, with the same placeholders as content. Omit to keep the saved subject, or send null to use the default subject.'
    )
});
export type TPublicApiSaveEmailTemplate = z.infer<typeof ZPublicApiSaveEmailTemplate>;

export const ZPublicApiSendTestEmailTemplate = z.object({
  recipientEmails: z.array(z.string().trim().email()).min(1).max(5).describe('1 to 5 addresses to send the test to'),
  content: z
    .string()
    .min(1)
    .max(50_000)
    .optional()
    .describe('Draft HTML body to test, with the same rules as saving; omit to test the current template.'),
  subject: z.string().min(1).max(200).optional().describe('Draft subject to test. Omit to test the current subject.')
});
export type TPublicApiSendTestEmailTemplate = z.infer<typeof ZPublicApiSendTestEmailTemplate>;
