import * as z from 'zod';

import type { EmailResponse } from '../utils/types';
import type { SendTemplateConfig } from './types';
import { deliverEmail } from '../send';

/**
 * Send a single email using a template
 * This function validates fields, generates content, and sends the email
 */
export async function sendTemplateEmail<TSchema extends z.ZodType>(
  config: SendTemplateConfig<TSchema>
): Promise<EmailResponse[]> {
  const content = config.template.render(config.fields);

  return deliverEmail([
    {
      to: config.to,
      subject: config.template.subject,
      content,
      from: config.from ?? config.template.from,
      replyTo: config.replyTo ?? config.template.replyTo
    }
  ]);
}
