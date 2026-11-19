import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { escapeHtml } from '../utils/functions/email-helpers';

export const webhookFailingEmail = defineEmail({
  id: 'webhookFailing',
  subject: 'A webhook is failing',
  schema: z.object({
    orgName: z.string().min(1),
    webhookName: z.string().min(1),
    destination: z.string().min(1),
    failureCount: z.number(),
    disableAfter: z.number(),
    webhooksUrl: z.url()
  }),
  render: (fields) => {
    const orgName = escapeHtml(fields.orgName);
    const webhookName = escapeHtml(fields.webhookName);
    const destination = escapeHtml(fields.destination);
    const webhooksUrl = escapeHtml(fields.webhooksUrl);

    const content = `
      <p>Hi there,</p>
      <p>The webhook <strong>${webhookName}</strong> (${destination}) in <strong>${orgName}</strong> has failed ${fields.failureCount} deliveries in a row.</p>
      <p>ClassroomIO keeps retrying each event, but if it reaches ${fields.disableAfter} failed deliveries in a row the webhook is disabled automatically and stops receiving events.</p>
      <div>
        <a class="button" href="${webhooksUrl}">Review your webhooks</a>
      </div>
    `;

    return getDefaultTemplate(content);
  }
});
