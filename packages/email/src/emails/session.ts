import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';
import { ZEmailBranding } from '../core/branding';

export const sessionReminderEmail = defineEmail({
  id: 'sessionReminder',
  subject: 'Reminder: your live session is coming up',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    sessionTitle: z.string().min(1),
    sessionTimeLabel: z.string().min(1),
    whenLabel: z.string().min(1),
    joinUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>Your live session <strong>${fields.sessionTitle}</strong> in <strong>${fields.courseName}</strong> starts <strong>${fields.whenLabel}</strong>.</p>
      <p><strong>When:</strong> ${fields.sessionTimeLabel}</p>
      <div>
        <a class="button" href="${fields.joinUrl}">Join the session</a>
      </div>
      <p>See you there,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});

export const sessionUpdatedEmail = defineEmail({
  id: 'sessionUpdated',
  subject: 'Updated: your live session details changed',
  schema: z.object({
    orgName: z.string().min(1),
    courseName: z.string().min(1),
    sessionTitle: z.string().min(1),
    sessionTimeLabel: z.string().min(1),
    joinUrl: z.string().min(1),
    branding: ZEmailBranding
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>The live session <strong>${fields.sessionTitle}</strong> in <strong>${fields.courseName}</strong> has been updated.</p>
      <p><strong>New time:</strong> ${fields.sessionTimeLabel}</p>
      <p>The attached calendar invite will update the event already on your calendar.</p>
      <div>
        <a class="button" href="${fields.joinUrl}">Join the session</a>
      </div>
      <p>Cheers,</p>
      <p>${fields.orgName}</p>
    `;

    return getDefaultTemplate(content, fields.branding);
  }
});
