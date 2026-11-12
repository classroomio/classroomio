import * as z from 'zod';

import { EMAIL_LOCALES, STUDENT_EMAIL_IDS } from '../../email';

// Response shape for OpenAPI docs only; handlers don't validate against it.
export const ZPublicApiEmailTemplateSummaryResponse = z.object({
  emailId: z.enum(STUDENT_EMAIL_IDS),
  locale: z.enum(EMAIL_LOCALES),
  subject: z.string().describe('The saved subject, or the default when none is saved'),
  isCustomized: z.boolean().describe('false when the template matches the default'),
  updatedAt: z.string().nullable().describe('When the template was last saved; null if it was never saved')
});

export const ZPublicApiEmailTemplateResponse = ZPublicApiEmailTemplateSummaryResponse.extend({
  content: z.string().describe('The saved HTML body, or the default when none is saved'),
  variables: z.array(z.string()).describe('Placeholders allowed in content and subject, written as {{name}}'),
  hasActionLink: z.boolean().describe('Whether content may link to {{action_url}}')
});

export const ZPublicApiEmailTemplateTestResponse = z.object({
  queued: z.literal(true)
});
