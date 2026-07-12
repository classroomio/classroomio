import * as z from 'zod';

import type { EmailResponse } from '../utils/types';
import type { SendTemplateConfig } from './types';
import { deliverEmail } from '../send';
import { sanitizeEmailSubject } from '../utils/functions/email-helpers';

/**
 * Send a single email using a template
 * This function validates fields, generates content, and sends the email
 */
export async function sendTemplateEmail<TSchema extends z.ZodType>(
  config: SendTemplateConfig<TSchema>
): Promise<EmailResponse[]> {
  const content = config.template.render(config.fields);

  const resolvedSubject =
    config.subject ??
    (typeof config.template.subject === 'function' ? config.template.subject(config.fields) : config.template.subject);

  return deliverEmail([
    {
      to: config.to,
      subject: sanitizeEmailSubject(resolvedSubject),
      content,
      from: config.from ?? config.template.from,
      replyTo: config.replyTo ?? config.template.replyTo,
      ics: config.ics
    }
  ]);
}
