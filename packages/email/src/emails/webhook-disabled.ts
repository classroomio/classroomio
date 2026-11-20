import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { escapeHtml } from '../utils/functions/email-helpers';

export const webhookDisabledEmail = defineEmail({
  id: 'webhookDisabled',
  subject: 'A webhook was disabled after repeated failures',
  schema: z.object({
    orgName: z.string().min(1),
    webhookName: z.string().min(1),
    destination: z.string().min(1),
    failureCount: z.number(),
    webhooksUrl: z.url()
  }),
  render: (fields) => {
    const orgName = escapeHtml(fields.orgName);
    const webhookName = escapeHtml(fields.webhookName);
    const destination = escapeHtml(fields.destination);
    const webhooksUrl = escapeHtml(fields.webhooksUrl);

    const content = `
      <p>Hi there,</p>
      <p>The webhook <strong>${webhookName}</strong> (${destination}) in <strong>${orgName}</strong> was disabled after ${fields.failureCount} failed deliveries in a row. It no longer receives events.</p>
      <p>Once your endpoint is fixed, turn the webhook back on and redeliver any events you missed from the delivery history.</p>
      <div>
        <a class="button" href="${webhooksUrl}">Open webhooks</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
