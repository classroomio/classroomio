import * as z from 'zod';

import { defineEmail } from '../send';
import { getDefaultTemplate } from '../templates';

export const studentLimitReachedEmail = defineEmail({
  id: 'studentLimitReached',
  subject: "You've reached your Free plan student limit",
  schema: z.object({
    orgName: z.string().min(1),
    studentCount: z.number(),
    studentLimit: z.number(),
    upgradeUrl: z.string().url()
  }),
  render: (fields) => {
    const content = `
      <p>Hi there,</p>
      <p>We're letting you know because new students are being turned away from <strong>${fields.orgName}</strong>: you've reached your Free plan's ${fields.studentLimit}-student limit (you currently have ${fields.studentCount} students). Anyone who tries to enrol, accept an invite, or join right now can't get in until you upgrade.</p>
      <div>
        <a class="button" href="${fields.upgradeUrl}">Upgrade your plan</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">We only send this once a day, so you won't hear from us every time it happens.</p>
    `;

    return getDefaultTemplate(content);
  }
});
